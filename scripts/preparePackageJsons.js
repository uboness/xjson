import fs from 'fs';
import path from 'path';

const distDir = './dist';

fs.readdir(distDir, function (err, dirs) {
    if (err) {
        throw err;
    }
    dirs.forEach(function (dir) {
        const type = dir === 'esm' ? 'module' : 'commonjs';
        const packageJsonFile = path.join(distDir, dir, '/package.json');
        if (!fs.existsSync(packageJsonFile)) {
            fs.writeFile(
                packageJsonFile,
                new Uint8Array(Buffer.from(`{ "type": "${type}" }`)),
                (err) => {
                    if (err) {
                        throw err;
                    }
                }
            );
        }
    });
});