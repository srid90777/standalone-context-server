'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var crossSpawn = require('cross-spawn');
var os = require('os');
var util = require('util');
var child_process = require('child_process');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var crossSpawn__namespace = /*#__PURE__*/_interopNamespace(crossSpawn);
var os__default = /*#__PURE__*/_interopDefault(os);

// src/ChildProcess.ts

// src/pollingSet.ts
var PollingSet = class extends Set {
  constructor(interval, action) {
    super();
    this.interval = interval;
    this.action = action;
  }
  pollTimer;
  isActive() {
    return this.size !== 0;
  }
  hasTimer() {
    return this.pollTimer !== void 0;
  }
  clearTimer() {
    if (!this.isActive() && this.hasTimer()) {
      clearInterval(this.pollTimer);
      this.pollTimer = void 0;
    }
  }
  poll() {
    this.action();
    if (!this.isActive()) {
      this.clearTimer();
    }
  }
  add(id) {
    super.add(id);
    this.pollTimer = this.pollTimer ?? setInterval(() => this.poll(), this.interval);
    return this;
  }
  clear() {
    this.clearTimer();
    super.clear();
  }
};

// src/ChildProcessTracker.ts
var MONITOR_INTERVAL = 5e3;
var WIN_RETRY_WAIT_INTERVAL = 5e3;
var execFileAsync = util.promisify(child_process.execFile);
var ChildProcessTracker = class _ChildProcessTracker {
  static pollingInterval = 1e4;
  // Check usage every 10 seconds
  static restartInterval = 1e4;
  // Restart after 10 seconds once the threshold value stabilizes
  static thresholds = {
    memory: 300 * 1024 * 1024,
    // 300 MB
    cpu: 70
  };
  static thresholdBuffer = {
    memory: 50 * 1024 * 1024,
    // 50 MB
    cpu: 30
  };
  #processByPid = /* @__PURE__ */ new Map();
  #pids;
  #scheduledForDeletion = /* @__PURE__ */ new Set();
  #retryCount = 0;
  constructor() {
    this.#pids = new PollingSet(_ChildProcessTracker.pollingInterval, () => this.monitor());
  }
  cleanUp() {
    const terminatedProcesses = Array.from(this.#pids.values()).filter(
      (pid) => this.#processByPid.get(pid)?.stopped
    );
    for (const pid of terminatedProcesses) {
      this.delete(pid);
    }
  }
  async monitor() {
    this.cleanUp();
    for (const pid of this.#pids.values()) {
      await this.checkProcessUsage(pid);
    }
  }
  async checkProcessUsage(pid) {
    if (!this.#pids.has(pid) || this.#scheduledForDeletion.has(pid)) {
      return;
    }
    const stats = await this.getUsage(pid);
    if (stats) {
      if (stats.memory > _ChildProcessTracker.thresholds.memory) {
        console.log(`Process ${pid} exceeded memory threshold: ${stats.memory}`);
        this.#scheduledForDeletion.add(pid);
        await this.ensureSafeResourceUsage(pid);
        return;
      }
      if (stats.cpu > _ChildProcessTracker.thresholds.cpu) {
        console.log(`Process ${pid} exceeded CPU threshold: ${stats.cpu}`);
        if (this.isWin()) {
          this.#scheduledForDeletion.add(pid);
        }
        await this.ensureSafeResourceUsage(pid);
        return;
      }
    }
  }
  isWin() {
    return process.platform === "win32";
  }
  async ensureSafeResourceUsage(pid) {
    let runningProcess;
    const cycleStep = this.#retryCount % 3 + 1;
    await new Promise((resolve) => setTimeout(resolve, cycleStep * MONITOR_INTERVAL));
    const stats = await this.getUsage(pid);
    if (stats.cpu === 0 && stats.memory === 0) {
      return;
    }
    for (const childProcess of this.#processByPid.values()) {
      if (pid === childProcess.pid()) {
        runningProcess = childProcess;
      }
    }
    const withinMemory = stats.memory < _ChildProcessTracker.thresholds.memory - _ChildProcessTracker.thresholdBuffer.memory;
    const withinCpu = stats.cpu < _ChildProcessTracker.thresholds.cpu - _ChildProcessTracker.thresholdBuffer.cpu;
    if (withinCpu && withinMemory) {
      if (!this.isWin()) {
        runningProcess?.resume();
      }
      return;
    }
    if (!withinMemory) {
      this.clear(pid);
      this.#retryCount = this.#retryCount + 1;
      await runningProcess?.restart(this.#retryCount);
      return;
    }
    if (!withinCpu) {
      if (this.isWin()) {
        this.clear(pid);
        await new Promise((r) => setTimeout(r, WIN_RETRY_WAIT_INTERVAL));
        this.#retryCount = this.#retryCount + 1;
        await runningProcess?.restart(this.#retryCount);
        return;
      }
      runningProcess?.pause();
      return;
    }
  }
  add(childProcess) {
    const pid = childProcess.pid();
    this.#processByPid.set(pid, childProcess);
    this.#pids.add(pid);
  }
  delete(childProcessId) {
    this.#processByPid.delete(childProcessId);
    this.#pids.delete(childProcessId);
  }
  get size() {
    return this.#pids.size;
  }
  has(childProcess) {
    return this.#pids.has(childProcess.pid());
  }
  clear(pid) {
    for (const childProcess of this.#processByPid.values()) {
      if (childProcess.pid() == pid) {
        this.#pids.delete(pid);
        this.#processByPid.delete(pid);
        childProcess.stop(true);
      }
    }
  }
  async getUsage(pid) {
    try {
      let memUsage;
      let cpuUsage;
      if (this.isWin()) {
        memUsage = await this.getWinMemUsage(pid);
        cpuUsage = memUsage === 0 ? 0 : await this.getWinCpuUsage(pid);
      } else {
        memUsage = await this.getUnixMemUsage(pid);
        cpuUsage = memUsage === 0 ? 0 : await this.getUnixCpuUsage(pid);
      }
      return {
        cpu: isNaN(cpuUsage) ? 0 : cpuUsage,
        memory: isNaN(memUsage) ? 0 : memUsage
      };
    } catch (e) {
      return { cpu: 0, memory: 0 };
    }
  }
  async getWinMemUsage(pid) {
    const execOptions = {
      stdio: ["pipe", "pipe", "ignore"],
      // suppress stderr such as 'No instance available'
      encoding: "utf8"
    };
    const { stdout: memOutput } = await execFileAsync(
      "wmic",
      ["process", "where", `ProcessId=${pid}`, "get", "WorkingSetSize"],
      execOptions
    );
    const memoryBytes = parseInt(memOutput.split("\n")[1]);
    return isNaN(memoryBytes) ? 0 : memoryBytes;
  }
  async getWinCpuUsage(pid) {
    const cpuCount = os__default.default.cpus().length;
    const execOptions = {
      stdio: ["pipe", "pipe", "ignore"],
      encoding: "utf8"
    };
    const { stdout: cpuOutput } = await execFileAsync(
      "wmic",
      ["path", "Win32_PerfFormattedData_PerfProc_Process", "where", `IDProcess=${pid}`, "get", "PercentProcessorTime"],
      execOptions
    );
    const cpuPercentage = parseFloat(cpuOutput.split("\n")[1]);
    return isNaN(cpuPercentage) ? 0 : cpuPercentage / cpuCount;
  }
  async getUnixMemUsage(pid) {
    const { stdout: rssOutput } = await execFileAsync("ps", ["-p", pid.toString(), "-o", "rss"]);
    return parseInt(rssOutput.split("\n")[1]) * 1024;
  }
  async getUnixCpuUsage(pid) {
    const cpuCount = os__default.default.cpus().length;
    const { stdout: cpuMemOutput } = await execFileAsync("ps", ["-p", pid.toString(), "-o", "%cpu,%mem"]);
    const cpuMemLines = cpuMemOutput.split("\n")[1].trim().split(/\s+/);
    const cpuPercentage = parseFloat(cpuMemLines[0]);
    return isNaN(cpuPercentage) ? 0 : cpuPercentage / cpuCount;
  }
};

// src/TimeoutUtils.ts
var waitUntilDefaultTimeout = 2e3;
var waitUntilDefaultInterval = 500;
async function waitUntil(fn, options) {
  const opt = {
    timeout: waitUntilDefaultTimeout,
    interval: waitUntilDefaultInterval,
    truthy: true,
    backoff: 1,
    retryOnFail: false,
    ...options
  };
  let interval = opt.interval;
  let lastError;
  let elapsed = 0;
  let remaining = opt.timeout;
  for (let i = 0; true; i++) {
    const start = Date.now();
    let result;
    try {
      if (remaining > 0) {
        result = await Promise.race([fn(), new Promise((r) => setTimeout(r, remaining))]);
      } else {
        result = await fn();
      }
      if (opt.retryOnFail || opt.truthy && result || !opt.truthy && result !== void 0) {
        return result;
      }
    } catch (e) {
      if (!opt.retryOnFail) {
        throw e;
      }
      if (!(e instanceof Error)) {
        throw e;
      }
      lastError = e;
    }
    remaining -= Date.now() - start;
    if (elapsed + interval >= remaining) {
      if (!opt.retryOnFail) {
        return void 0;
      }
      throw lastError;
    }
    if (interval > 0) {
      await sleep(interval);
    }
    elapsed += interval;
    interval = interval * opt.backoff;
  }
}
function sleep(duration = 0) {
  const schedule = setTimeout;
  return new Promise((r) => schedule(r, Math.max(duration, 0)));
}

// src/ChildProcess.ts
var eof = Symbol("EOF");
var COMPLETE_CODE = 0;
var ChildProcess = class _ChildProcess {
  static #runningProcesses = new ChildProcessTracker();
  static stopTimeout = 3e3;
  #childProcess;
  #processErrors = [];
  #processResult;
  /** Collects stdout data if the process was started with `collect=true`. */
  #stdoutChunks = [];
  /** Collects stderr data if the process was started with `collect=true`. */
  #stderrChunks = [];
  #command;
  #args;
  #baseOptions;
  #options;
  #makeResult(code, signal) {
    return {
      exitCode: code,
      stdout: this.#stdoutChunks.join("").trim(),
      stderr: this.#stderrChunks.join("").trim(),
      error: this.#processErrors[0],
      // Only use the first since that one usually cascades.
      signal
    };
  }
  constructor(command, args = [], baseOptions = {}) {
    this.#command = command;
    this.#args = args;
    this.#baseOptions = baseOptions;
  }
  static async run(command, args = [], options) {
    return await new _ChildProcess(command, args, options).run();
  }
  async restart(retryCount) {
    console.log("Restarting....");
    retryCount > 1 ? this.#args.splice(-1, 1, retryCount) : this.#args.push(retryCount);
    await new _ChildProcess(this.#command, this.#args, this.#baseOptions).run();
  }
  async run(params = {}) {
    if (this.#childProcess) {
      throw new Error("process already started");
    }
    const options = this.#options ?? {
      collect: true,
      waitForStreams: true,
      ...this.#baseOptions,
      ...params,
      spawnOptions: { ...this.#baseOptions.spawnOptions, ...params.spawnOptions }
    };
    this.#options = options;
    const { rejectOnError, rejectOnErrorCode } = options;
    this.#args.concat(options.extraArgs ?? []);
    const cleanup = () => {
      this.#childProcess?.stdout?.removeAllListeners();
      this.#childProcess?.stderr?.removeAllListeners();
    };
    return new Promise((resolve, reject) => {
      const errorHandler = (error, force = options.useForceStop) => {
        this.#processErrors.push(error);
        if (!this.stopped) {
          this.stop(force);
        }
        if (rejectOnError) {
          if (typeof rejectOnError === "function") {
            reject(rejectOnError(error));
          } else {
            reject(error);
          }
        }
      };
      const paramsContext = {
        stop: this.stop.bind(this),
        send: this.send.bind(this),
        reportError: (err) => errorHandler(err instanceof Error ? err : new Error(err))
      };
      try {
        this.#childProcess = crossSpawn__namespace.spawn(this.#command, this.#args, options.spawnOptions);
        this.#registerLifecycleListeners(this.#childProcess);
      } catch (err) {
        return reject(err);
      }
      this.#childProcess?.on("error", errorHandler);
      this.#childProcess?.stdout?.on("error", errorHandler);
      this.#childProcess?.stderr?.on("error", errorHandler);
      this.#childProcess?.stdout?.on("data", (data) => {
        if (options.collect) {
          this.#stdoutChunks.push(data.toString());
        }
        options.onStdout?.(data.toString(), paramsContext);
      });
      this.#childProcess?.stderr?.on("data", (data) => {
        if (options.collect) {
          this.#stderrChunks.push(data.toString());
        }
        options.onStderr?.(data.toString(), paramsContext);
      });
      this.#childProcess?.once("close", (code, signal) => {
        this.#processResult = this.#makeResult(code ?? -1, signal ?? void 0);
        console.log("this.#processResult", this.#processResult);
        resolve(this.#processResult);
      });
      this.#childProcess?.once("exit", (code, signal) => {
        this.#processResult = this.#makeResult(
          typeof code === "number" ? code : -1,
          typeof signal === "string" ? signal : void 0
        );
        if (code === COMPLETE_CODE) {
          options.onExit();
        }
        if (code && rejectOnErrorCode) {
          if (typeof rejectOnErrorCode === "function") {
            reject(rejectOnErrorCode(code));
          } else {
            reject(new Error(`Command exited with non-zero code: ${code}`));
          }
        }
        if (options.waitForStreams === false) {
          resolve(this.#processResult);
        }
      });
    }).finally(() => cleanup());
  }
  result() {
    return this.#processResult;
  }
  pid() {
    return this.#childProcess?.pid ?? -1;
  }
  exitCode() {
    return this.#childProcess?.exitCode ?? -1;
  }
  pause() {
    this.stop(false, "SIGSTOP");
  }
  resume() {
    this.stop(false, "SIGCONT");
  }
  stop(force = false, signal) {
    const child = this.#childProcess;
    if (!child || child.stdin?.destroyed) {
      return;
    }
    this.#command;
    this.pid();
    if (!this.stopped) {
      child.kill(signal);
      if (force === true) {
        waitUntil(async () => this.stopped, { timeout: _ChildProcess.stopTimeout, interval: 50, truthy: true }).then((stopped) => {
          if (!stopped) {
            child.kill("SIGKILL");
          }
        }).catch((e) => {
        });
      }
    } else {
      throw new Error("Attempting to kill a process that has already been killed");
    }
  }
  #registerLifecycleListeners(process2) {
    const pid = process2.pid;
    if (pid === void 0) {
      return;
    }
    _ChildProcess.#runningProcesses.add(this);
  }
  async send(input) {
    if (this.#childProcess === void 0) {
      throw new Error("Cannot write to non-existent process");
    }
    const stdin = this.#childProcess.stdin;
    if (!stdin) {
      throw new Error("Cannot write to non-existent stdin");
    }
    if (input === eof) {
      return new Promise((resolve) => stdin.end("", resolve));
    }
    return new Promise((resolve, reject) => stdin.write(input, (e) => e ? reject(e) : resolve()));
  }
  get stopped() {
    if (!this.#childProcess) {
      return false;
    }
    return !!this.#processResult;
  }
  toString(noparams = false) {
    const pid = this.pid() > 0 ? `PID ${this.pid()}:` : "(not started)";
    return `${pid} [${this.#command} ${noparams ? "..." : this.#args.join(" ")}]`;
  }
};

// src/AsyncQueue.ts
var AsyncQueue = class {
  items = [];
  resolves = [];
  done = false;
  push(item) {
    if (this.resolves.length) {
      const resolve = this.resolves.shift();
      resolve?.({ value: item, done: false });
    } else {
      this.items.push(item);
    }
  }
  close() {
    this.done = true;
    while (this.resolves.length) {
      const resolve = this.resolves.shift();
      resolve?.({ value: void 0, done: true });
    }
  }
  [Symbol.asyncIterator]() {
    return {
      next: () => {
        if (this.items.length) {
          return Promise.resolve({ value: this.items.shift(), done: false });
        }
        if (this.done) {
          return Promise.resolve({ value: void 0, done: true });
        }
        return new Promise((resolve) => {
          this.resolves.push(resolve);
        });
      }
    };
  }
};

// src/index.ts
var index_default = ChildProcess;

exports.AsyncQueue = AsyncQueue;
exports.default = index_default;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map