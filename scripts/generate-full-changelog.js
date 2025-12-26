#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Generates a full changelog from all git history, organized by releases/tags
 */
function generateFullChangelog() {
  const changelogPath = path.resolve(__dirname, '../CHANGELOG.md');

  // Get all tags sorted by version
  let tags = [];
  try {
    const tagsOutput = execSync('git tag -l --sort=-version:refname', {
      encoding: 'utf8',
    });
    tags = tagsOutput.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.log('No tags found, generating changelog from all commits');
  }

  // Get all commits
  let commits = [];
  try {
    const commitsOutput = execSync(
      'git log --pretty=format:"%H|%s|%an|%ad" --date=short --no-merges',
      { encoding: 'utf8' },
    );
    commits = commitsOutput
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => {
        const [hash, subject, author, date] = line.split('|');
        return { hash, subject, author, date };
      });
  } catch (error) {
    console.error('Error getting git commits:', error.message);
    process.exit(1);
  }

  // Group commits by tag/release
  const releases = [];
  let currentRelease = {
    tag: null,
    date: null,
    commits: [],
  };

  // Process commits and group by tags
  // First, get all tagged commits
  const taggedCommits = new Map();
  for (const tag of tags) {
    try {
      const tagHash = execSync(`git rev-list -n 1 ${tag}`, {
        encoding: 'utf8',
      }).trim();
      if (tagHash) {
        taggedCommits.set(tagHash, tag);
      }
    } catch (error) {
      // Tag might not exist or be invalid
    }
  }

  // Process commits and group by tags
  for (const commit of commits) {
    const commitTag = taggedCommits.get(commit.hash);

    if (commitTag) {
      // Save previous release if it has commits
      if (currentRelease.commits.length > 0 || currentRelease.tag) {
        releases.push({ ...currentRelease });
      }
      // Start new release
      currentRelease = {
        tag: commitTag,
        date: commit.date,
        commits: [commit],
      };
    } else {
      currentRelease.commits.push(commit);
    }
  }

  // Add the last release
  if (currentRelease.commits.length > 0 || currentRelease.tag) {
    releases.push(currentRelease);
  }

  // If no releases found, create one with all commits
  if (releases.length === 0) {
    releases.push({
      tag: null,
      date: commits[0]?.date || new Date().toISOString().split('T')[0],
      commits: commits,
    });
  }

  // Generate changelog content
  let changelog = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;

  // Group commits by type
  function categorizeCommit(subject) {
    if (subject.match(/^feat(\(.+\))?:/i)) return 'features';
    if (subject.match(/^fix(\(.+\))?:/i)) return 'bugfixes';
    if (subject.match(/^perf(\(.+\))?:/i)) return 'performance';
    if (subject.match(/^refactor(\(.+\))?:/i)) return 'refactor';
    if (subject.match(/^style(\(.+\))?:/i)) return 'style';
    if (subject.match(/^test(\(.+\))?:/i)) return 'tests';
    if (subject.match(/^docs(\(.+\))?:/i)) return 'docs';
    if (subject.match(/^build(\(.+\))?:/i)) return 'build';
    if (subject.match(/^ci(\(.+\))?:/i)) return 'ci';
    if (subject.match(/^chore(\(.+\))?:/i)) return 'chore';
    if (subject.match(/^release(\(.+\))?:/i)) return 'release';
    return 'other';
  }

  // Generate release sections
  for (const release of releases) {
    const version = release.tag ? release.tag.replace(/^v/, '') : 'Unreleased';
    const date = release.date || 'TBD';

    changelog += `## [${version}] - ${date}\n\n`;

    // Categorize commits
    const categorized = {
      features: [],
      bugfixes: [],
      performance: [],
      refactor: [],
      style: [],
      tests: [],
      docs: [],
      build: [],
      ci: [],
      chore: [],
      release: [],
      other: [],
    };

    for (const commit of release.commits) {
      const category = categorizeCommit(commit.subject);
      categorized[category].push(commit);
    }

    // Write sections
    const sectionLabels = {
      features: '✨ Features',
      bugfixes: '🐛 Bug Fixes',
      performance: '⚡ Performance Improvements',
      refactor: '♻️ Code Refactoring',
      style: '💄 Styles',
      tests: '✅ Tests',
      docs: '📝 Documentation',
      build: '🏗️ Build System',
      ci: '👷 CI/CD',
      chore: '🔧 Chores',
      release: '🚀 Releases',
      other: '📦 Other Changes',
    };

    for (const [category, label] of Object.entries(sectionLabels)) {
      if (categorized[category].length > 0) {
        changelog += `### ${label}\n\n`;
        for (const commit of categorized[category]) {
          // Clean up commit message (remove type prefix if present)
          let message = commit.subject;
          // Remove conventional commit prefix (e.g., "feat(scope): message" -> "message")
          message = message.replace(
            /^(feat|fix|perf|refactor|style|test|docs|build|ci|chore|release)(\(.+\))?:\s*/i,
            '',
          );
          changelog += `- ${message}\n`;
        }
        changelog += '\n';
      }
    }

    changelog += '\n';
  }

  // Write changelog
  fs.writeFileSync(changelogPath, changelog, 'utf8');
  console.log(
    `✅ Generated full changelog with ${releases.length} release(s) and ${commits.length} commit(s)`,
  );
  console.log(`📝 Changelog written to: ${changelogPath}`);
}

generateFullChangelog();
