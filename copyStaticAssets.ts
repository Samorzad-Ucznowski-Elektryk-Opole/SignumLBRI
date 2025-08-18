import * as shell from "shelljs";

// shell.cp("-R", "src/public/js/lib", "dist/public/js/");
// shell.cp("-R", "src/public/css/*.css", "dist/public/css/");
shell.cp("-R", "src/public/locales", "dist/public/locales");
shell.cp("-R", "src/public/fonts", "dist/public/");
shell.cp("-R", "src/public/images", "dist/public/");
shell.cp("-R", "src/public/models", "dist/public/");
shell.cp("src/public/meta.json", "dist/");
