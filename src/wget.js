/**
 * DevCom `wget` command
 * @class
 * 
 * Download a web file
 */
class Wget extends lib.DevCom {
    
    /**
     * Run the `wget` built-in devcom
     * 
     * @param {object} devTool - Instance of DevToolCommandLine
     * @param {object} options - Options for argument list
     */
    run(devTool, options) {
        if (options.args.length !== 2) {
            let lines = [
                'WGet usage: ' + devTool.name + ' wget [url] [path]',
                '  url    URL of the web file',
                '  path   Path to save web file local'
            ];

            throw createError(lines.join(_os.EOL));
        }

        let url = _url.parse(options.args[0]),
            path = _path.resolve(options.args[1]);

        if (!url.protocol) {
            throw createError('Invalid URL: ' + options.args[0]);
        }

        lib.download(url.href, path);
    }
}
