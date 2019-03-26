import { getSpinner, ISpinnerInterface } from './Spinner';
import { colors } from './chroma';
export interface ILogger {
  group: (name: string | boolean) => void;
  info: (msg: string, variables?: { [key: string]: any }) => void;
  status: (msg: string, variables?: { [key: string]: any }) => void;
  warn: (msg: string, variables?: { [key: string]: any }) => void;
  error: (msg: string, variables?: { [key: string]: any }) => void;
  deprecated: (msg: string, variables?: { [key: string]: any }) => void;
  withSpinner: () => void;
  stopSpinner: () => void;
}

type ILoggerType = 'verbose' | 'succinct' | 'disabled';
export interface ILoggerProps {
  level: ILoggerType;
}

export function getLogger(props?: ILoggerProps): ILogger {
  let level: ILoggerType = props && props.level ? props.level : 'succinct';
  if (process.env.JEST_TEST) {
    level = 'disabled';
  }

  if (process.argv.includes('--verbose')) {
    level = 'verbose';
  }
  const scope: {
    group?: string;
    spinner?: ISpinnerInterface;
  } = {};

  function log(color: string, text: string, variables: { [key: string]: any }) {
    if (level === 'disabled') {
      return;
    }
    if (variables) {
      for (const key in variables) {
        text = text.replace(`$${key}`, variables[key]);
      }
    }

    let colouredText = colors[color](text);

    const output = scope.group ? ` ${colors.bold(colors[color](scope.group))}  ${colouredText}` : ` ${colouredText}`;

    if (level === 'succinct') {
      if (scope.spinner) {
        scope.spinner.setText(output);
      } else {
        console.log(output);
      }
    }
    if (level === 'verbose') {
      console.log(output);
    }
  }
  const methods = {
    group: (name: string | boolean) => {
      if (typeof name == 'boolean') {
        if (name === false) {
          delete scope.group;
        }
      } else {
        scope.group = name;
      }
    },
    info: (msg: string, variables?: { [key: string]: any }) => {
      log('cyan', msg, variables);
    },
    status: (msg: string, variables?: { [key: string]: any }) => {
      log('green', msg, variables);
    },
    warn: (msg: string, variables?: { [key: string]: any }) => {
      log('yellow', msg, variables);
    },
    error: (msg: string, variables?: { [key: string]: any }) => {
      log('red', msg, variables);
    },
    deprecated: (msg: string, variables?: { [key: string]: any }) => {
      log('red', msg, variables);
    },
    withSpinner: () => {
      const spinner = getSpinner({
        onStop: () => {
          delete scope.spinner;
        },
      });

      scope.spinner = spinner;
      return spinner;
    },
    stopSpinner: () => {
      if (scope.spinner) {
        scope.spinner.stop();
        delete scope.spinner;
      }
    },
  };
  if (level === 'succinct') {
    const spinner = methods.withSpinner();
    spinner.start();
    scope.spinner = spinner;
  }
  return methods;
}
