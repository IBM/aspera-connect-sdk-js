const gulp = require("gulp");
const inlinesource = require("gulp-inline-source");
const replace = require("gulp-replace");

gulp.task("default", () => {
  return gulp
    .src("./dist/*.html")
    .pipe(replace('type="module" ', ''))
    .pipe(replace('crossorigin ', ''))
    .pipe(replace('.js"></script>', '.js" inline></script>'))
    .pipe(replace('.css">', '.css" inline>'))
    .pipe(
      inlinesource({
        compress: false,
        ignore: ["png"],
      })
    )
    .pipe(gulp.dest("./dist/inline"));
});
