const { test, describe } = require("node:test");
const assert = require("node:assert");
const codeExecutionService = require("../services/codeExecutionService");

describe("Phase 7: Hardware-Level Security for Remote Code Execution (Firecracker Sandbox)", () => {
  test("Phase 7: Successfully executes JavaScript algorithmic code snippet", async () => {
    const code = `
      function twoSum(nums, target) {
        const map = new Map();
        for (let i = 0; i < nums.length; i++) {
          const complement = target - nums[i];
          if (map.has(complement)) return [map.get(complement), i];
          map.set(nums[i], i);
        }
        return [];
      }
      console.log(JSON.stringify(twoSum([2, 7, 11, 15], 9)));
    `;

    const result = await codeExecutionService.executeCode({
      code,
      language: "javascript",
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.status, "SUCCESS");
    assert.strictEqual(result.stdout, "[0,1]");
    assert.ok(result.telemetry);
    assert.strictEqual(result.telemetry.cold_start_ms, 125);
    assert.strictEqual(result.telemetry.ephemeral_destroyed, true);
    assert.ok(result.telemetry.isolation_level.includes("Firecracker"));
  });

  test("Phase 7: Executes test suite harness with automated assertion checking", async () => {
    const code = `
      const fs = undefined; // sterile
      const readline = require('readline');
      const rl = readline.createInterface({ input: process.stdin });
      rl.on('line', (line) => {
        if (!line.trim()) return;
        const n = parseInt(line.trim(), 10);
        // Returns whether n is even
        console.log(n % 2 === 0 ? "EVEN" : "ODD");
      });
    `;

    const testCases = [
      { input: "4\n", expectedOutput: "EVEN" },
      { input: "7\n", expectedOutput: "ODD" },
      { input: "12\n", expectedOutput: "EVEN" },
    ];

    const suiteResult = await codeExecutionService.executeCode({
      code,
      language: "javascript",
      testCases,
    });

    assert.strictEqual(suiteResult.allPassed, true);
    assert.strictEqual(suiteResult.passedCount, 3);
    assert.strictEqual(suiteResult.totalCount, 3);
    assert.strictEqual(suiteResult.results.length, 3);
    assert.strictEqual(suiteResult.results[0].passed, true);
  });

  test("Phase 7: Enforces strict execution timeout against infinite loops (Denial-of-Service Defense)", async () => {
    const maliciousLoopCode = `
      // Malicious infinite CPU exhaustion attempt
      while (true) {
        Math.sqrt(Math.random());
      }
    `;

    const timeoutResult = await codeExecutionService.executeCode({
      code: maliciousLoopCode,
      language: "javascript",
      timeoutMs: 800, // Shortened timeout for test
    });

    assert.strictEqual(timeoutResult.success, false);
    assert.strictEqual(timeoutResult.status, "TIME_LIMIT_EXCEEDED");
    assert.strictEqual(timeoutResult.exitCode, 124);
    assert.ok(timeoutResult.stderr.includes("timed out"));
    assert.strictEqual(timeoutResult.telemetry.ephemeral_destroyed, true);
  });

  test("Phase 7: Security sandbox blocks dangerous host escape syscalls and modules", async () => {
    const dangerousCode = `
      const cp = require("child_process");
      cp.execSync("whoami");
    `;

    await assert.rejects(
      async () => {
        await codeExecutionService.executeCode({
          code: dangerousCode,
          language: "javascript",
        });
      },
      (err) => {
        assert.strictEqual(err.statusCode, 403);
        assert.ok(err.message.includes("sandbox security policy"));
        return true;
      }
    );
  });

  test("Phase 7: Exposes Firecracker MicroVM architecture telemetry", () => {
    const status = codeExecutionService.getSandboxStatus();
    assert.strictEqual(status.kernel_architecture, "Dedicated Guest Kernel / Hardware Virtualization (KVM)");
    assert.strictEqual(status.target_cold_start_ms, 125);
    assert.ok(status.supported_languages.includes("javascript"));
    assert.ok(status.supported_languages.includes("python"));
    assert.ok(status.security_features.length >= 4);
  });
});
