exports.run = function (grunt) {
    var monoParams = {
        browser: 'chrome'
    };
  var monoParamsFf = {
    browser: 'firefox'
  };

    grunt.config.merge({
        compress: {
            chrome: {
                options: {
                    mode: 'zip',
                    archive: '<%= output %><%= vendor %>../<%= buildName %>.zip'
                },
                files: [{
                    cwd: '<%= output %><%= vendor %>',
                    expand: true,
                    filter: 'isFile',
                    src: '**',
                    dest: ''
                }]
            }
        },
        copy: {
            chromeBase: {
                cwd: 'src/vendor/chrome/',
                expand: true,
                src: [
                    'js/**'
                ],
                dest: '<%= output %><%= vendor %>'
            }
        }
    });

    grunt.registerTask('chromeManifestFormat', function() {
        "use strict";
        var src = grunt.template.process('<%= output %><%= vendor %>manifest.json');
        var json = grunt.file.readJSON(src);
        grunt.file.write(src, JSON.stringify(json, null, 4));
    });

    grunt.registerTask('chromeManifest', function() {
        var manifestPath = grunt.template.process('<%= output %><%= vendor %>manifest.json');
        var content = grunt.file.readJSON('src/manifest.json');
        content.version = grunt.config('pkg.extVersion');
        grunt.file.write(manifestPath, JSON.stringify(content));
    });

    grunt.registerTask('chrome', function () {
        grunt.config('monoParams', monoParams);

        grunt.config.merge({
            browser: 'chrome',
            vendor: 'chrome/src/',
            libFolder: 'js/',
            dataJsFolder: 'js/',
            includesFolder: 'includes/',
            dataFolder: '',
            buildName: 'uTorrentEasyClient_<%= pkg.extVersion %>'
        });

        grunt.task.run([
            'extensionBase',
            'copy:chromeBase',
            'chromeManifest',
            'compressJs',
            'chromeManifestFormat',
            'compress:chrome'
        ]);
    });

    grunt.registerTask('opera', function () {
        grunt.config('monoParams', monoParams);

        grunt.config.merge({
            browser: 'opera',
            vendor: 'opera/src/',
            libFolder: 'js/',
            dataJsFolder: 'js/',
            includesFolder: 'includes/',
            dataFolder: '',
            buildName: 'uTorrentEasyClient_opera_<%= pkg.extVersion %>'
        });

        grunt.task.run([
            'extensionBase',
            'copy:chromeBase',
            'chromeManifest',
            'compressJs',
            'chromeManifestFormat',
            'compress:chrome'
        ]);
    });

  grunt.registerTask('firefoxCreateManifest', function() {
    var src = grunt.template.process('<%= output %><%= vendor %>manifest.json');
    var manifest = grunt.file.readJSON(src);

    manifest.applications = {
      gecko: {
        id: grunt.config('geckoId'),
        strict_min_version: '48.0'
      }
    };

    manifest.options_ui = {};
    manifest.options_ui.page = manifest.options_page;
    manifest.options_ui.open_in_tab = true;

    delete manifest.options_page;

    grunt.file.write(src, JSON.stringify(manifest, null, 4));
  });

  grunt.registerTask('firefox', function () {
    grunt.config('monoParams', monoParamsFf);

    grunt.config.merge({
      geckoId: 'jid1-xJrt4U23zkSdbA@jetpack',
      browser: 'firefox',
      vendor: 'firefox/src/',
      libFolder: 'js/',
      dataJsFolder: 'js/',
      includesFolder: 'includes/',
      dataFolder: '',
      buildName: 'uTorrentEasyClient_firefox_<%= pkg.extVersion %>'
    });

    grunt.task.run([
      'extensionBase',
      'chromeManifest',
      'firefoxCreateManifest',
      'compressJs',
      'compress:chrome'
    ]);
  });
};