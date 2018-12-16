module.exports = function (grunt) {
    grunt.initConfig({
        'download-electron': {
            version: '0.24.0',
            outputDir: 'build'
        },
        'symlink': {
            'atom': {
                src: 'app',
                dest: 'build/Electron.app/Contents/Resources/app'
            },
            'npm': {
                src: 'app',
                dest: 'app/node_modules/hp'
            }
        },
        'install-dependencies': {
            options: {
                cwd: 'app'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-symlink');
    grunt.loadNpmTasks('grunt-download-electron');
    grunt.loadNpmTasks('grunt-install-dependencies');
    grunt.registerTask('default', ['download-electron', 'install-dependencies', 'symlink']);

};
