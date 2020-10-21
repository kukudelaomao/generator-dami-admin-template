const ora = require('ora');
const path = require('path');
const fs = require('fs-extra');
const boxen = require('boxen');
const chalk = require('chalk');
const beeper = require('beeper');
const download = require('download-git-repo');
const Generator = require('yeoman-generator');
const updateNotifier = require('update-notifier');
const pkg = require('../../package.json');

const BOXEN_OPTS = {
    padding: 1,
    margin: 1,
    align: 'center',
    borderColor: 'yellow',
    borderStyle: 'round'
};
const APP_TYPE = {
    web: 'web',
    electron: 'electron'
};
const GIT_BASE = 'https://github.com/';
const DAMI_WEB_REPOSITORY = 'direct:https://github.com/kukudelaomao/dami-admin-template.git';
const ELECTRON_REPOSITORY = 'direct:https://github.com/kukudelaomao/vue-electron-admin.git';
const ORA_SPINNER = {
    "interval": 80,
    "frames": [
        "   ⠋",
        "   ⠙",
        "   ⠚",
        "   ⠞",
        "   ⠖",
        "   ⠦",
        "   ⠴",
        "   ⠲",
        "   ⠳",
        "   ⠓"
    ]
};
const PROJECT_ATTR = {
    "name": 'Dami Admin'
}

class DamiAdminTemplateGenerator extends Generator {
    constructor(params, opts) {
        super(params, opts);

        this.type = APP_TYPE.web;
        this.dirName = this._getDefaultDir();

        this._getDefaultDir = this._getDefaultDir.bind(this);
        this._askForDir = this._askForDir.bind(this);
        this._askDirFlow = this._askDirFlow.bind(this);
        this._askProjectName = this._askProjectName.bind(this);
        this._askForAppType = this._askForAppType.bind(this);
        this._askForOverwrite = this._askForOverwrite.bind(this);
    }

    // 【方法】获取默认文件夹名
    _getDefaultDir() {
        return `${this.type}-app`;
    }

    // 【方法】检查版本信息
    _checkVersion() {
        this.log();
        this.log('※  Checking your Generator-Dami-Admin-Template version...');

        let checkResult = false;
        const notifier = updateNotifier({
            pkg,
            updateCheckInterval: 1000
        });

        const update = notifier.update;
        if (update) {
            const messages = [];
            messages.push(
                chalk.bgYellow.black(' WARNI: ')
                + '  Generator-Dami-Admin-Template is not latest.\n'
            );
            messages.push(
                chalk.grey('current ')
                + chalk.grey(update.current)
                + chalk.grey(' → ')
                + chalk.grey('latest ')
                + chalk.green(update.latest)
                + '\n'
            );
            messages.push(
                chalk.grey('Up to date ')
                + `npm i -g ${pkg.name}`
            );
            this.log(boxen(messages.join('\n'), BOXEN_OPTS));
            beeper();
            this.log('※  Finish checking your Generator-Dami-Admin-Template. CAUTION ↑↑', chalk.yellow('★'));
        }
        else {
            checkResult = true;
            this.log('※  Finish checking your Generator-Dami-Admin-Template. OK', chalk.green('✔'));
        }

        return checkResult;
    }
    
    // 【方法】获取环境信息
    _printEnvInfo() {
        this.log(chalk.grey('Environment Info:'))
        this.log(chalk.grey(`Node\t${process.version}`));
        this.log(chalk.grey(`CWD\t${process.cwd()}`));
    }

    // 初始化
    initializing() {
        this.log();

        const version = `(v${pkg.version})`;
        const messages = [];
        messages.push(
            `❤ Welcome to use Generator-Dami-Admin-Template ${chalk.grey(version)}   `
        );
        messages.push(
            chalk.yellow('You can create a template-based frontend environment.')
        );
        messages.push(
            chalk.grey('https://github.com/kukudelaomao/generator-dami-admin-template')
        );
        messages.push(
            chalk.grey('https://www.npmjs.com/package/generator-dami-admin-template')
        )
        this.log(
            boxen(messages.join('\n'), {
                ...BOXEN_OPTS,
                ...{
                    borderColor: 'green',
                    borderStyle: 'doubleSingle'
                }
            })
        );

        this._printEnvInfo();
        this._checkVersion();
    }

    // 【方法】列表选择类型
    _askForAppType() {
        const opts = [{
            type: 'list',
            name: 'type',
            choices: [{
                name: 'dami-admin-template (web page)',
                value: APP_TYPE.web
            }, {
                name: 'vue-electron-admin (desktop app)',
                value: APP_TYPE.electron
            }],
            message: 'Please choose the type for your project：',
            default: APP_TYPE.web
        }];

        return this.prompt(opts).then(({type}) => {
            this.type = type;
            this.dirName = this._getDefaultDir();
        });
    }

    // 【方法】输入项目目录名
    _askForDir() {
        const opts = [{
            type: 'input',
            name: 'dirName',
            message: 'Please enter the directory name for your project：',
            default: this.dirName,
            validate: dirName => {
                if (dirName.length < 1) {
                    beeper();
                    return `${chalk.grey('★')}  directory name must not be null！`;
                }
                return true;
            }
        }];

        return this.prompt(opts).then(({dirName}) => {
            this.dirName = dirName;
        });
    }

    // 【方法】项目目录名重复时的处理
    _askForOverwrite() {
        const destination = this.destinationPath();
        const dirName = this.dirName;
        if (!fs.existsSync(path.resolve(destination, dirName))) {
            return Promise.resolve();
        }

        const warn = chalk.grey('CAUTION! Files may be overwritten.');
        const opts = [{
            type: 'confirm',
            name: 'overwrite',
            message: `${chalk.grey('★')}  Directory ${dirName} exists. Whether use this directory still? ${warn}`,
            default: false
        }];

        return this.prompt(opts).then(({overwrite}) => {
            if (!overwrite) {
                this.dirName = this._getDefaultDir();
                return this._askDirFlow();
            }
        });
    }

    // 【方法】项目目录名的设置
    _askDirFlow() {
        return this._askForDir().then(this._askForOverwrite);
    }

    // 【方法】输入项目名称（标题）
    _askProjectName() {
        const opts = [{
            type: 'input',
            name: 'projectName',
            message: 'Please enter the project name for your project：',
            default: PROJECT_ATTR.name,
            validate: projectName => {
                if (projectName.length < 1) {
                    beeper();
                    return `${chalk.grey('★')}  project name must not be null！`;
                }
                return true;
            }
        }];

        return this.prompt(opts).then(({projectName}) => {
            this.projectName = projectName;
        });
    }

    // 处理用户交互
    // 用户交互是一个“异步”的行为，为了让后续生命周期方法在“异步”完成后再继续执行，需要调用this.async()方法来通知方法为异步方法，避免顺序执行完同步代码后直接调用下一阶段的生命周期方法。调用后会返回一个函数，执行函数表明该阶段完成。
    prompting() {
        this.log();
        this.log('*  Basic configuration...');
        const done = this.async();
        
        this._askForAppType()
            .then(this._askDirFlow)
            .then(this._askProjectName)
            .then(done);
    }

    // 下载对应名称的框架代码
    // 如果某些方法你不希望被 Yeoman 的脚手架流程直接调用，而是作为工具方法提供给其他类方法，则可以添加一个下划线前缀。对于这种命名的方法，则会在default阶段被忽略。
    _downloadTemplate(repository) {
        return new Promise((resolve, reject) => {
            const dirPath = this.destinationPath(this.dirName, '.tmp');
            download(repository, dirPath, { clone: true }, err => err ? reject(err) : resolve());
        });
    }

    // 遍历拷贝下载好的文件
    _walk(filePath, templateRoot) {
        if (fs.statSync(filePath).isDirectory()) {
            fs.readdirSync(filePath).forEach(name => {
                this._walk(path.resolve(filePath, name), templateRoot);
            });
            return;
        }

        const relativePath = path.relative(templateRoot, filePath);
        const destination = this.destinationPath(this.dirName, relativePath);
        // this.log(this.dirName, this.projectName)
        this.fs.copyTpl(filePath, destination, {
            dirName: this.dirName,
            projectName: this.projectName
        });
    }

    // 写入操作，使用了上面的两个工具函数
    writing() {
        const done = this.async();
        const repository = this.type === APP_TYPE.web
            ? DAMI_WEB_REPOSITORY
            : ELECTRON_REPOSITORY;

        this.log('*  Finish basic configuration.', chalk.green('✔'));
        this.log();
        this.log('✿  Generate the project template and configuration...');

        let spinner = ora({
            text: `Download the template from ${repository}...`,
            spinner: ORA_SPINNER
        }).start();
        this._downloadTemplate(repository)
            .then(() => {
                spinner.stopAndPersist({
                    symbol: chalk.green('   ✔'),
                    text: `Finish downloading the template from ${repository}`
                });

                spinner = ora({
                    text: `Copy files into the project folder...`,
                    spinner: ORA_SPINNER
                }).start();
                const templateRoot = this.destinationPath(this.dirName, '.tmp');
                this._walk(templateRoot, templateRoot);
                spinner.stopAndPersist({
                    symbol: chalk.green('   ✔'),
                    text: `Finish copying files into the project folder`
                });

                spinner = ora({
                    text: `Clean tmp files and folders...`,
                    spinner: ORA_SPINNER
                }).start();
                fs.removeSync(templateRoot);
                spinner.stopAndPersist({
                    symbol: chalk.green('   ✔'),
                    text: `Finish cleaning tmp files and folders`
                });
                done();
            })
            .catch(err => this.env.error(err));
    }

    // 安装生成的项目模板
    install() {
        this.log();
        this.log('✿  Finish generating the project template and configuration.', chalk.green('✔'));
        this.log();
        this.log('➤  Install dependencies...');

        this.npmInstall('', {}, {
            cwd: this.destinationPath(this.dirName)
        });
    }

    end() {
        const dir = chalk.green(this.dirName);
        const info = `⌘  Create project successfully! Now you can enter ${dir} and start to code. ⌘`;
        this.log('■  Finish installing dependencies.', chalk.green('✔'));
        this.log();
        this.log(
            boxen(info, {
                ...BOXEN_OPTS,
                ...{
                    borderColor: 'white'
                }
            })
        );
    }

}

module.exports = DamiAdminTemplateGenerator;
