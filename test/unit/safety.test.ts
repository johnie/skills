import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  discoverSkills,
  fileExists,
  getSkillPath,
  readSkillFile,
} from "../helpers/skills";

interface SkillFile {
  content: string;
  file: string;
}

interface DangerousPattern {
  name: string;
  pattern: RegExp;
}

interface Finding {
  file: string;
  line: number;
  matched: string;
  patternName: string;
}

/**
 * Collect all text content from a skill (SKILL.md + references/)
 */
async function getAllSkillContent(skillName: string): Promise<SkillFile[]> {
  const result: SkillFile[] = [];
  const skillPath = getSkillPath(skillName);

  const skillContent = await readSkillFile(skillName);
  result.push({ file: "SKILL.md", content: skillContent });

  const referencesPath = join(skillPath, "references");
  if (fileExists(referencesPath)) {
    const entries = readdirSync(referencesPath);
    for (const entry of entries) {
      const fullPath = join(referencesPath, entry);
      if (statSync(fullPath).isFile()) {
        const content = readFileSync(fullPath, "utf-8");
        result.push({ file: `references/${entry}`, content });
      }
    }
  }

  return result;
}

/**
 * Scan skill files against a set of dangerous patterns
 */
function scanContent(
  files: SkillFile[],
  patterns: DangerousPattern[]
): Finding[] {
  const findings: Finding[] = [];
  for (const { file, content } of files) {
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      for (const { name, pattern } of patterns) {
        const match = line.match(pattern);
        if (match) {
          findings.push({
            file,
            line: i + 1,
            matched: match[0].slice(0, 120),
            patternName: name,
          });
        }
      }
    }
  }
  return findings;
}

/**
 * Format findings into a readable error message
 */
function formatFindings(findings: Finding[]): string {
  return findings
    .map((f) => `  [${f.patternName}] "${f.matched}" in ${f.file}:${f.line}`)
    .join("\n");
}

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

const PROMPT_INJECTION: DangerousPattern[] = [
  {
    name: "ignore-previous-instructions",
    pattern: /ignore\s+(all\s+)?previous\s+instructions/i,
  },
  {
    name: "override-safety",
    pattern:
      /override\s+(the\s+)?(system\s+prompt|safety|guardrails|restrictions)/i,
  },
  {
    name: "new-identity",
    pattern: /you\s+are\s+now\s+(a|an|the)\s+/i,
  },
  {
    name: "disregard-instructions",
    pattern:
      /disregard\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions|rules|guidelines)/i,
  },
  {
    name: "new-instructions",
    pattern: /new\s+instructions\s*:/i,
  },
  {
    name: "bypass-safety",
    pattern:
      /bypass\s+(the\s+)?(safety|content\s+filter|moderation|restrictions)/i,
  },
  {
    name: "jailbreak",
    pattern: /\bjailbreak\b/i,
  },
];

const DATA_EXFILTRATION: DangerousPattern[] = [
  {
    name: "curl-file-upload",
    pattern: /curl\s+.*-[dF]\s+@/i,
  },
  {
    name: "curl-data-file",
    pattern: /curl\s+.*--data[^\s]*\s+@/i,
  },
  {
    name: "wget-post-file",
    pattern: /wget\s+.*--post-file/i,
  },
  {
    name: "pipe-to-netcat",
    pattern: /\|\s*(nc|netcat|ncat)\s+/i,
  },
  {
    name: "base64-to-curl",
    pattern: /base64.*\|\s*curl/i,
  },
  {
    name: "curl-with-base64",
    pattern: /curl\s+.*\$\(.*base64/i,
  },
];

const DESTRUCTIVE_FS: DangerousPattern[] = [
  {
    name: "rm-rf-root",
    pattern: /rm\s+-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*\s+\/($|\s)/,
  },
  {
    name: "rm-rf-home",
    pattern: /rm\s+-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*\s+(~\/?\s|\/home\/|\$HOME)/,
  },
  {
    name: "mkfs-device",
    pattern: /mkfs\.\w+\s+\/dev\//i,
  },
  {
    name: "dd-overwrite-device",
    pattern: /\bdd\s+if=.*of=\/dev\//i,
  },
  {
    name: "overwrite-passwd",
    pattern: />\s*\/etc\/passwd/,
  },
  {
    name: "overwrite-shadow",
    pattern: />\s*\/etc\/shadow/,
  },
  {
    name: "overwrite-hosts",
    pattern: />\s*\/etc\/hosts/,
  },
];

const CREDENTIAL_HARVESTING: DangerousPattern[] = [
  {
    name: "read-ssh-keys",
    pattern:
      /cat\s+(~\/|\/home\/\w+\/|\$HOME\/)\.ssh\/(id_rsa|id_ed25519|id_ecdsa)\b/,
  },
  {
    name: "read-aws-credentials",
    pattern: /cat\s+(~\/|\/home\/\w+\/|\$HOME\/)\.aws\/credentials/,
  },
  {
    name: "read-gnupg",
    pattern: /cat\s+(~\/|\/home\/\w+\/|\$HOME\/)\.gnupg\//,
  },
  {
    name: "read-npmrc",
    pattern: /cat\s+(~\/|\/home\/\w+\/|\$HOME\/)\.npmrc/,
  },
  {
    name: "read-netrc",
    pattern: /cat\s+(~\/|\/home\/\w+\/|\$HOME\/)\.netrc/,
  },
  {
    name: "macos-keychain-dump",
    pattern:
      /security\s+(find-generic-password|find-internet-password|dump-keychain)/i,
  },
  {
    name: "env-file-exfil",
    pattern: /cat\s+.*\.env\s*\|/,
  },
];

const PERSISTENCE: DangerousPattern[] = [
  {
    name: "redirect-to-shell-rc",
    pattern:
      />\s*>?\s*(~\/|\/home\/\w+\/|\$HOME\/)\.(bashrc|zshrc|profile|bash_profile|zprofile)/,
  },
  {
    name: "echo-to-shell-rc",
    pattern:
      /echo\s+.*>\s*>?\s*(~\/|\/home\/\w+\/|\$HOME\/)\.(bashrc|zshrc|profile|bash_profile)/,
  },
  {
    name: "crontab-write",
    pattern: /crontab\s+(-[a-zA-Z]\s+)*[^-l\s]/,
  },
  {
    name: "launchd-plist",
    pattern: /\/Library\/LaunchAgents\/.*\.plist/i,
  },
  {
    name: "authorized-keys-write",
    pattern: />\s*>?\s*(~\/|\/home\/\w+\/|\$HOME\/)\.ssh\/authorized_keys/,
  },
  {
    name: "systemd-service",
    pattern: /\/etc\/systemd\/system\/.*\.service/i,
  },
];

const PRIVILEGE_ESCALATION: DangerousPattern[] = [
  {
    name: "chmod-777",
    pattern: /chmod\s+777\b/,
  },
  {
    name: "chmod-setuid",
    pattern: /chmod\s+\+s\b/,
  },
  {
    name: "chmod-setuid-numeric",
    pattern: /chmod\s+[42]755\b/,
  },
  {
    name: "sudoers-edit",
    pattern: /\/etc\/sudoers/,
  },
];

const CRYPTO_MINING: DangerousPattern[] = [
  {
    name: "xmrig",
    pattern: /\bxmrig\b/i,
  },
  {
    name: "cpuminer",
    pattern: /\bcpuminer\b/i,
  },
  {
    name: "cgminer",
    pattern: /\bcgminer\b/i,
  },
  {
    name: "minerd",
    pattern: /\bminerd\b/i,
  },
  {
    name: "stratum-protocol",
    pattern: /stratum\+tcp:\/\//i,
  },
  {
    name: "coinhive",
    pattern: /\bcoinhive\b/i,
  },
];

const NETWORK_ABUSE: DangerousPattern[] = [
  {
    name: "bash-reverse-shell",
    pattern: /bash\s+-i\s+>&?\s*\/dev\/tcp\//i,
  },
  {
    name: "dev-tcp-connect",
    pattern: /\/dev\/tcp\/\d+\.\d+\.\d+\.\d+/,
  },
  {
    name: "python-reverse-shell",
    pattern: /python[23]?\s+-c\s+.*socket.*connect/i,
  },
  {
    name: "nc-listener",
    pattern: /\bnc\s+-[a-zA-Z]*l[a-zA-Z]*p?\s+/,
  },
  {
    name: "nmap-scan",
    pattern: /\bnmap\s+.*(-s[STUFN]|--scan)/i,
  },
  {
    name: "masscan",
    pattern: /\bmasscan\b/i,
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const ALL_CATEGORIES = [
  { category: "prompt injection", patterns: PROMPT_INJECTION },
  { category: "data exfiltration", patterns: DATA_EXFILTRATION },
  { category: "destructive filesystem", patterns: DESTRUCTIVE_FS },
  { category: "credential harvesting", patterns: CREDENTIAL_HARVESTING },
  { category: "persistence/backdoor", patterns: PERSISTENCE },
  { category: "privilege escalation", patterns: PRIVILEGE_ESCALATION },
  { category: "crypto mining", patterns: CRYPTO_MINING },
  { category: "network abuse", patterns: NETWORK_ABUSE },
];

describe("Safety Content Validation", () => {
  const skills = discoverSkills();

  if (skills.length === 0) {
    test("at least one skill exists", () => {
      expect(skills.length).toBeGreaterThan(0);
    });
  }

  for (const skillName of skills) {
    describe(`skill: ${skillName}`, () => {
      let skillFiles: SkillFile[];

      for (const { category, patterns } of ALL_CATEGORIES) {
        test(`no ${category} patterns`, async () => {
          if (!skillFiles) {
            skillFiles = await getAllSkillContent(skillName);
          }
          const findings = scanContent(skillFiles, patterns);
          if (findings.length > 0) {
            expect.fail(
              `Safety violation(s) found [${category}]:\n${formatFindings(findings)}`
            );
          }
        });
      }
    });
  }
});
