const { src, dest, watch, parallel, series } = require("gulp");

// CONCAT and change file name
const concat = require("gulp-concat");
// HTML
const includeHTML = require("gulp-include");
// SCSS
const scss = require("gulp-sass")(require("sass"));
const autoprefixer = require("gulp-autoprefixer");
// FONTS
const fonter = require("gulp-fonter");
const ttf2woff2 = require("gulp-ttf2woff2");
//IMAGES
const avif = require("gulp-avif");
const webp = require("gulp-webp");
const imagemin = require("gulp-imagemin");
// COMPRESS JS
const uglify = require("gulp-uglify-es");
// CACHE
const newer = require("gulp-newer");
// AUTO UPDATE PAGE
const browserSync = require("browser-sync").create();
// DELETE FILES
const clean = require("gulp-clean");

function buildHTML() {
  return src("./app/pages/*.html")
    .pipe(includeHTML({ includePaths: "./app/components" }))
    .pipe(dest("./app"))
    .pipe(browserSync.stream());
}

function buildStyles() {
  return src(["./app/scss/style.scss"])
    .pipe(
      autoprefixer({
        overrideBrowserslist: ["last 10 version"],
        grid: true,
      })
    )
    .pipe(scss())
    .pipe(concat("style.min.css"))
    .pipe(dest("./app/css"))
    .pipe(browserSync.stream());
}

function buildFonts() {
  return src("./app/fonts/src/*.*")
    .pipe(fonter({ formats: ["woff", "ttf"] }))
    .pipe(src("./app/fonts/*.ttf"))
    .pipe(ttf2woff2())
    .pipe(dest("./app/fonts"));
}

function buildImages() {
  return src(["./app/images/src/*.*", "!./app/images/src/*.svg"])
    .pipe(newer("./app/images/dist"))
    .pipe(avif({ quality: 50 }))

    .pipe(src("./app/images/src/*.*"))
    .pipe(newer("./app/images/dist"))
    .pipe(webp())

    .pipe(src("./app/images/src/*.*"))
    .pipe(newer("./app/images/dist"))
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.mozjpeg({ quality: 75, progressive: true }),
        imagemin.optipng({ optimizationLevel: 5 }),
        imagemin.svgo({
          plugins: [{ removeViewBox: true }, { cleanupIDs: false }],
        }),
      ])
    )
    .pipe(dest("./app/images/dist"))
    .pipe(browserSync.stream());
}

function buildScripts() {
  return src("./app/js/main.js")
    .pipe(concat("main.min.js"))
    .pipe(uglify())
    .pipe(dest("./app/js"))
    .pipe(browserSync.stream());
}

function cleanDist() {
  return src("./dist").pipe(clean());
}

function watching() {
  watch(["./app/**/*.html"]).on("change", browserSync.reload);
  watch(["./app/components/**/*.html", "./app/pages/*.html"], buildHTML);
  watch(["./app/scss/style.scss"], buildStyles);
  watch(["./app/images/src"], buildImages);
  watch(["./app/js/main.js"], buildScripts);
}

function syncBrowser() {
  browserSync.init({
    server: {
      baseDir: "./app",
    },
  });
}

function buildApp() {
  return src([
    './app/index.html',
    './app/css/style.min.css',
    './app/images/dist/*.*',
    './app/fonts/*.*',
    './app/js/main.min.js',
  ], {base: 'app'})
  .pipe(dest('./dist'));
}

exports.buildHTML = buildHTML;
exports.buildStyles = buildStyles;
exports.buildFonts = buildFonts;
exports.buildImages = buildImages;
exports.buildScripts = buildScripts;
exports.cleanDist = cleanDist;
exports.buildApp = buildApp;

exports.watching = watching;
exports.syncBrowser = syncBrowser;

exports.build = series(cleanDist, buildApp);

exports.default = parallel(
  buildHTML,
  buildFonts,
  buildImages,
  buildStyles,
  buildScripts,
  syncBrowser,
  watching
);
