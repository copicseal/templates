/* eslint-disable no-console */
/* eslint-disable node/prefer-global/process */
import chalk from 'chalk';
import ora from 'ora';

class Logger {
  constructor() {
    this.startTime = Date.now();
  }

  info(message, details = '') {
    const timestamp = this.getTimestamp();
    const fullMessage = details ? `${message} ${chalk.gray('→')} ${details}` : message;
    console.log(`${chalk.blue('ℹ️')} [${timestamp}] ${fullMessage}`);
  }

  success(message, details = '') {
    const timestamp = this.getTimestamp();
    const fullMessage = details ? `${message} ${chalk.gray('→')} ${details}` : message;
    console.log(`${chalk.green('✅')} [${timestamp}] ${fullMessage}`);
  }

  warning(message, details = '') {
    const timestamp = this.getTimestamp();
    const fullMessage = details ? `${message} ${chalk.gray('→')} ${details}` : message;
    console.log(`${chalk.yellow('⚠️')} [${timestamp}] ${fullMessage}`);
  }

  error(message, details = '') {
    const timestamp = this.getTimestamp();
    const fullMessage = details ? `${message} ${chalk.gray('→')} ${details}` : message;
    console.log(`${chalk.red('❌')} [${timestamp}] ${fullMessage}`);
  }

  title(title, subtitle = '') {
    const border = chalk.cyan('═').repeat(50);
    const titleLine = chalk.cyan(`╔${border}╗`);
    const content = chalk.white(`║${title.padEnd(50)}║`);
    const subtitleLine = subtitle ? chalk.gray(`║${subtitle.padEnd(50)}║`) : '';
    const endLine = chalk.cyan(`╚${border}╝`);

    console.log(`\n${titleLine}`);
    console.log(content);
    if (subtitleLine)
      console.log(subtitleLine);
    console.log(`${endLine}\n`);
  }

  spinner(text) {
    return ora({
      text: chalk.yellow(text),
      spinner: 'dots12',
      color: 'yellow',
    });
  }

  stats(title, data) {
    console.log(`\n${chalk.magenta('📊')} ${chalk.magentaBright.bold(title)}:`);
    Object.entries(data).forEach(([key, value]) => {
      const formattedValue = typeof value === 'number' ? chalk.cyanBright(value.toString()) : chalk.gray(value);
      console.log(`   ${chalk.white('•')} ${key}: ${formattedValue}`);
    });
    console.log('');
  }

  progress(current, total, label = 'Progress') {
    const percentage = Math.round((current / total) * 100);
    const filled = Math.round((percentage / 100) * 20);
    const empty = 20 - filled;
    const bar = chalk.green('█').repeat(filled) + chalk.gray('░').repeat(empty);

    process.stdout.write(`\r${chalk.blue('🔄')} ${label}: [${bar}] ${percentage}% (${current}/${total})`);
    if (current === total) {
      console.log('\n');
    }
  }

  formatTime(ms) {
    if (ms < 1000)
      return `${ms}ms`;
    if (ms < 60000)
      return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  timing(label) {
    const duration = Date.now() - this.startTime;
    console.log(`${chalk.gray('⏱️')} ${label}: ${chalk.cyanBright(this.formatTime(duration))}`);
  }

  getTimestamp() {
    return new Date().toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  separator(char = '─', length = 50) {
    console.log(chalk.gray(char.repeat(length)));
  }

  space() {
    console.log('');
  }

  section(title) {
    this.separator();
    console.log(`${chalk.cyan('▶')} ${chalk.cyanBright.bold(title)}`);
    this.separator();
  }
}

export const logger = new Logger();
