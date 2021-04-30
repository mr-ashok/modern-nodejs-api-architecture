import Enum from '../../typings/Enum';

export const Color = {
    Default: 39,
    Black: 30,
    Red: 31,
    Green: 32,
    Yellow: 33,
    Blue: 34,
    Magenta: 35,
    Cyan: 36,
    LightGray: 37,
    DarkGray: 90,
    LightRed: 91,
    LightGreen: 92,
    LightYellow: 93,
    LightBlue: 94,
    LightMagenta: 95,
    LightCyan: 96,
    White: 97,
} as const;

export type ColorType = Enum<typeof Color>;

const BACKGROUND_COLOR_OFFSET = 10;

export class ConsoleFormatter {
    private backgroundColor: ColorType = Color.Default;
    private textColor: ColorType = Color.Default;

    private transformToBold: boolean = false;

    constructor(private readonly text: string) {}

    format(): string {
        let res = `${this.text}`;
        if (this.transformToBold) {
            res = `\x1b[1m${res}\x1b[21m`;
        }
        res = `\x1b[${this.backgroundColor + BACKGROUND_COLOR_OFFSET}m\x1b[${this.textColor}m${res}\x1b[0m`;
        return res;
    }

    setBackgroundColor(color: ColorType = Color.Default): ConsoleFormatter {
        this.backgroundColor = color;
        return this;
    }

    setTextBold(): ConsoleFormatter {
        this.transformToBold = true;
        return this;
    }

    setTextColor(color: ColorType = Color.Default): ConsoleFormatter {
        this.textColor = color;
        return this;
    }
}
