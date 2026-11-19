import { app } from 'electron';
import fs from 'fs';
import path from 'path';

const MAX_LOG_BYTES = 5 * 1024 * 1024;

function getLogDirectory(): string {
    return path.join(app.getPath('userData'), 'logs');
}

export function getLogFilePath(): string {
    return path.join(getLogDirectory(), 'alepdv.log');
}

function errorDetails(error: unknown): Record<string, unknown> {
    if (error instanceof Error) {
        const candidate = error as Error & {
            code?: string;
            errno?: number;
            sqlState?: string;
        };
        return {
            name: candidate.name,
            message: candidate.message,
            code: candidate.code,
            errno: candidate.errno,
            sqlState: candidate.sqlState,
            stack: candidate.stack,
        };
    }

    return { message: String(error) };
}

function write(level: 'info' | 'warn' | 'error', event: string, details?: Record<string, unknown>): void {
    try {
        const directory = getLogDirectory();
        fs.mkdirSync(directory, { recursive: true });

        const filePath = getLogFilePath();
        if (fs.existsSync(filePath) && fs.statSync(filePath).size >= MAX_LOG_BYTES) {
            const previousFile = `${filePath}.1`;
            if (fs.existsSync(previousFile)) fs.unlinkSync(previousFile);
            fs.renameSync(filePath, previousFile);
        }

        const entry = {
            timestamp: new Date().toISOString(),
            level,
            event,
            details: details ?? {},
        };
        fs.appendFileSync(filePath, `${JSON.stringify(entry)}\n`, 'utf8');
    } catch (error) {
        console.error('Não foi possível gravar no log local do AlePDV:', error);
    }
}

export const logger = {
    info(event: string, details?: Record<string, unknown>) {
        write('info', event, details);
    },

    warn(event: string, details?: Record<string, unknown>) {
        write('warn', event, details);
    },

    error(event: string, error: unknown, details?: Record<string, unknown>) {
        write('error', event, { ...details, error: errorDetails(error) });
    },
};
