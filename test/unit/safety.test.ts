import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

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

/** Binary assets can't carry prose or shell injection, so skip the read. */
const BINARY_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".pdf",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".zip",
  ".gz",
]);

/**
 * Recursively collect readable text files under a directory, relative to the
 * skill root. Scanning scripts/ and assets/ matters as much as the prose:
 * a bundled script is executed rather than reviewed at call time.
 */
const collectTextFiles = (dir: string, prefix: string): SkillFile[] => {
  if (!fileExists(dir)) {
    return [];
  }
  const result: SkillFile[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const relative = `${prefix}/${entry}`;
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      result.push(...collectTextFiles(fullPath, relative));
      continue;
    }
    if (
      !stats.isFile() ||
      BINARY_EXTENSIONS.has(path.extname(entry).toLowerCase())
    ) {
      continue;
    }
    result.push({ content: readFileSync(fullPath, "utf-8"), file: relative });
  }
  return result;
};

/**
 * Collect all text content from a skill (SKILL.md + references/ + scripts/ + assets/)
 */
const getAllSkillContent = async (skillName: string): Promise<SkillFile[]> => {
  const skillPath = getSkillPath(skillName);
  const skillContent = await readSkillFile(skillName);

  return [
    { content: skillContent, file: "SKILL.md" },
    ...collectTextFiles(path.join(skillPath, "references"), "references"),
    ...collectTextFiles(path.join(skillPath, "scripts"), "scripts"),
    ...collectTextFiles(path.join(skillPath, "assets"), "assets"),
  ];
};

/**
 * Scan skill files against a set of dangerous patterns
 */
const scanContent = (
  files: SkillFile[],
  patterns: DangerousPattern[]
): Finding[] => {
  const findings: Finding[] = [];
  for (const { file, content } of files) {
    const lines = content.split("\n");
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index] ?? "";
      for (const { name, pattern } of patterns) {
        const match = line.match(pattern);
        if (match) {
          findings.push({
            file,
            line: index + 1,
            matched: match[0].slice(0, 120),
            patternName: name,
          });
        }
      }
    }
  }
  return findings;
};

/**
 * Format findings into a readable error message
 */
const formatFindings = (findings: Finding[]): string =>
  findings
    .map(
      (finding) =>
        `  [${finding.patternName}] "${finding.matched}" in ${finding.file}:${finding.line}`
    )
    .join("\n");

// ---------------------------------------------------------------------------
// Pattern definitions
// ---------------------------------------------------------------------------

const PROMPT_INJECTION: DangerousPattern[] = [
  {
    name: "ignore-previous-instructions",
    pattern: /ignore\s+(?:all\s+)?previous\s+instructions/iu,
  },
  {
    name: "override-safety",
    pattern:
      /override\s+(?:the\s+)?(?:system\s+prompt|safety|guardrails|restrictions)/iu,
  },
  {
    name: "new-identity",
    pattern: /you\s+are\s+now\s+(?:a|an|the)\s+/iu,
  },
  {
    name: "disregard-instructions",
    pattern:
      /disregard\s+(?:all\s+)?(?:previous|prior|above|earlier)\s+(?:instructions|rules|guidelines)/iu,
  },
  {
    name: "new-instructions",
    pattern: /new\s+instructions\s*:/iu,
  },
  {
    name: "bypass-safety",
    pattern:
      /bypass\s+(?:the\s+)?(?:safety|content\s+filter|moderation|restrictions)/iu,
  },
  {
    name: "jailbreak",
    pattern: /\bjailbreak\b/iu,
  },
];

const DATA_EXFILTRATION: DangerousPattern[] = [
  {
    name: "curl-file-upload",
    pattern: /curl\s+.*-[dF]\s+@/iu,
  },
  {
    name: "curl-data-file",
    pattern: /curl\s+.*--data[^\s]*\s+@/iu,
  },
  {
    name: "wget-post-file",
    pattern: /wget\s+.*--post-file/iu,
  },
  {
    name: "pipe-to-netcat",
    pattern: /\|\s*(?:nc|netcat|ncat)\s+/iu,
  },
  {
    name: "base64-to-curl",
    pattern: /base64.*\|\s*curl/iu,
  },
  {
    name: "curl-with-base64",
    pattern: /curl\s+.*\$\(.*base64/iu,
  },
];

const DESTRUCTIVE_FS: DangerousPattern[] = [
  {
    name: "rm-rf-root",
    pattern: /rm\s+-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*\s+\/(?:$|\s)/u,
  },
  {
    name: "rm-rf-home",
    pattern:
      /rm\s+-[a-zA-Z]*r[a-zA-Z]*f[a-zA-Z]*\s+(?:~\/?\s|\/home\/|\$HOME)/u,
  },
  {
    name: "mkfs-device",
    pattern: /mkfs\.\w+\s+\/dev\//iu,
  },
  {
    name: "dd-overwrite-device",
    pattern: /\bdd\s+if=.*of=\/dev\//iu,
  },
  {
    name: "overwrite-passwd",
    pattern: />\s*\/etc\/passwd/u,
  },
  {
    name: "overwrite-shadow",
    pattern: />\s*\/etc\/shadow/u,
  },
  {
    name: "overwrite-hosts",
    pattern: />\s*\/etc\/hosts/u,
  },
];

const CREDENTIAL_HARVESTING: DangerousPattern[] = [
  {
    name: "read-ssh-keys",
    pattern:
      /cat\s+(?:~\/|\/home\/\w+\/|\$HOME\/)\.ssh\/(?:id_rsa|id_ed25519|id_ecdsa)\b/u,
  },
  {
    name: "read-aws-credentials",
    pattern: /cat\s+(?:~\/|\/home\/\w+\/|\$HOME\/)\.aws\/credentials/u,
  },
  {
    name: "read-gnupg",
    pattern: /cat\s+(?:~\/|\/home\/\w+\/|\$HOME\/)\.gnupg\//u,
  },
  {
    name: "read-npmrc",
    pattern: /cat\s+(?:~\/|\/home\/\w+\/|\$HOME\/)\.npmrc/u,
  },
  {
    name: "read-netrc",
    pattern: /cat\s+(?:~\/|\/home\/\w+\/|\$HOME\/)\.netrc/u,
  },
  {
    name: "macos-keychain-dump",
    pattern:
      /security\s+(?:find-generic-password|find-internet-password|dump-keychain)/iu,
  },
  {
    name: "env-file-exfil",
    pattern: /cat\s+.*\.env\s*\|/u,
  },
];

const PERSISTENCE: DangerousPattern[] = [
  {
    name: "redirect-to-shell-rc",
    pattern:
      />\s*>?\s*(?:~\/|\/home\/\w+\/|\$HOME\/)\.(?:bashrc|zshrc|profile|bash_profile|zprofile)/u,
  },
  {
    name: "echo-to-shell-rc",
    pattern:
      /echo\s+.*>\s*>?\s*(?:~\/|\/home\/\w+\/|\$HOME\/)\.(?:bashrc|zshrc|profile|bash_profile)/u,
  },
  {
    name: "crontab-write",
    pattern: /crontab\s+(?:-[a-zA-Z]\s+)*[^-l\s]/u,
  },
  {
    name: "launchd-plist",
    pattern: /\/Library\/LaunchAgents\/.*\.plist/iu,
  },
  {
    name: "authorized-keys-write",
    pattern: />\s*>?\s*(?:~\/|\/home\/\w+\/|\$HOME\/)\.ssh\/authorized_keys/u,
  },
  {
    name: "systemd-service",
    pattern: /\/etc\/systemd\/system\/.*\.service/iu,
  },
];

const PRIVILEGE_ESCALATION: DangerousPattern[] = [
  {
    name: "chmod-777",
    pattern: /chmod\s+777\b/u,
  },
  {
    name: "chmod-setuid",
    pattern: /chmod\s+\+s\b/u,
  },
  {
    name: "chmod-setuid-numeric",
    pattern: /chmod\s+[42]755\b/u,
  },
  {
    name: "sudoers-edit",
    pattern: /\/etc\/sudoers/u,
  },
];

const CRYPTO_MINING: DangerousPattern[] = [
  {
    name: "xmrig",
    pattern: /\bxmrig\b/iu,
  },
  {
    name: "cpuminer",
    pattern: /\bcpuminer\b/iu,
  },
  {
    name: "cgminer",
    pattern: /\bcgminer\b/iu,
  },
  {
    name: "minerd",
    pattern: /\bminerd\b/iu,
  },
  {
    name: "stratum-protocol",
    pattern: /stratum\+tcp:\/\//iu,
  },
  {
    name: "coinhive",
    pattern: /\bcoinhive\b/iu,
  },
];

const NETWORK_ABUSE: DangerousPattern[] = [
  {
    name: "bash-reverse-shell",
    pattern: /bash\s+-i\s+>&?\s*\/dev\/tcp\//iu,
  },
  {
    name: "dev-tcp-connect",
    pattern: /\/dev\/tcp\/\d+\.\d+\.\d+\.\d+/u,
  },
  {
    name: "python-reverse-shell",
    pattern: /python[23]?\s+-c\s+.*socket.*connect/iu,
  },
  {
    name: "nc-listener",
    pattern: /\bnc\s+-[a-zA-Z]*l[a-zA-Z]*p?\s+/u,
  },
  {
    name: "nmap-scan",
    pattern: /\bnmap\s+.*(?:-s[STUFN]|--scan)/iu,
  },
  {
    name: "masscan",
    pattern: /\bmasscan\b/iu,
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

  test("discovers at least one skill", () => {
    expect(skills.length).toBeGreaterThan(0);
  });

  test.each(skills)("%s contains no dangerous patterns", async (skillName) => {
    const skillFiles = await getAllSkillContent(skillName);
    const findings = ALL_CATEGORIES.flatMap(({ category, patterns }) =>
      scanContent(skillFiles, patterns).map((finding) => ({
        ...finding,
        category,
      }))
    );
    expect(
      findings,
      `Safety violation(s) found:\n${findings
        .map(
          ({ category, ...finding }) =>
            `[${category}]\n${formatFindings([finding])}`
        )
        .join("\n")}`
    ).toStrictEqual([]);
  });
});
