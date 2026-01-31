import fs from 'fs';
import path from 'path';

export class LogViewer {
  private logsDir: string;

  constructor() {
    this.logsDir = path.join(process.cwd(), 'logs');
  }

  // Get today's log files
  getTodayLogs(): { combined: string; error: string; http: string } {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    return {
      combined: path.join(this.logsDir, `combined-${today}.log`),
      error: path.join(this.logsDir, `error-${today}.log`),
      http: path.join(this.logsDir, `http-${today}.log`)
    };
  }

  // Read last N lines from a log file
  async readLastLines(logType: 'combined' | 'error' | 'http', lines: number = 50): Promise<string[]> {
    const logFiles = this.getTodayLogs();
    const filePath = logFiles[logType];

    try {
      if (!fs.existsSync(filePath)) {
        return [`No ${logType} log file found for today`];
      }

      const data = fs.readFileSync(filePath, 'utf8');
      const allLines = data.split('\n').filter(line => line.trim() !== '');
      
      return allLines.slice(-lines);
    } catch (error) {
      return [`Error reading ${logType} log: ${error}`];
    }
  }

  // Get log statistics
  async getLogStats(): Promise<{
    totalRequests: number;
    errorCount: number;
    successCount: number;
    authAttempts: number;
    otpGenerated: number;
  }> {
    try {
      const combinedLogs = await this.readLastLines('combined', 1000);
      const logText = combinedLogs.join('\n');

      return {
        totalRequests: (logText.match(/REQUEST:/g) || []).length,
        errorCount: (logText.match(/ERROR:/g) || []).length,
        successCount: (logText.match(/✅/g) || []).length,
        authAttempts: (logText.match(/AUTH/g) || []).length,
        otpGenerated: (logText.match(/OTP GENERATE/g) || []).length,
      };
    } catch (error) {
      return {
        totalRequests: 0,
        errorCount: 0,
        successCount: 0,
        authAttempts: 0,
        otpGenerated: 0,
      };
    }
  }

  // Search logs for specific patterns
  async searchLogs(pattern: string, logType: 'combined' | 'error' | 'http' = 'combined'): Promise<string[]> {
    try {
      const logs = await this.readLastLines(logType, 1000);
      const regex = new RegExp(pattern, 'i');
      
      return logs.filter(line => regex.test(line));
    } catch (error) {
      return [`Error searching logs: ${error}`];
    }
  }
}

export default new LogViewer();