import { input, confirm, select, password } from '@inquirer/prompts';
import { execa } from 'execa';
import fs from 'node:fs';
import path from 'node:path';
import { readdirSync, statSync, existsSync, readFileSync, writeFileSync } from 'node:fs';

(async () => {
    try {
        await loginToSupabase();
        let projectName, projectRef, useExisting = false, existingProject = null;
        while (true) {
            projectName = await input({
                message: 'Enter the name of the project:',
                default: 'CRM',
            });
            if (!projectName || projectName.trim().length < 3) {
                console.error('Project name must be at least 3 characters long.');
                continue;
            }
            const matches = await findProjectsByName(projectName);
            if (matches.length > 1) {
                console.log(`Multiple projects found matching "${projectName}":`);
                const selected = await select({
                    message: 'Select a project to use or choose to create a new one:',
                    choices: [
                        ...matches.map(p => ({
                            name: `${p.name} (Ref: ${p.id}, Status: ${p.status})`,
                            value: p.id
                        })),
                        { name: 'Create a new project', value: null }
                    ]
                });
                if (selected) {
                    existingProject = matches.find(p => p.id === selected);
                    useExisting = true;
                } else {
                    useExisting = false;
                }
            } else if (matches.length === 1) {
                existingProject = matches[0];
                console.log(`A project named "${projectName}" already exists.`);
                console.log(`Project Ref: ${existingProject.id}`);
                console.log(`Status: ${existingProject.status}`);
                if (existingProject.status !== 'ACTIVE_HEALTHY') {
                    const proceed = await confirm({
                        message: `Project status is ${existingProject.status}. Proceed anyway?`,
                        default: false
                    });
                    if (!proceed) continue;
                }
                useExisting = await confirm({
                    message: 'Do you want to use the existing project?',
                    default: true,
                });
            }
            if (useExisting && existingProject) {
                projectRef = existingProject.id;
                break;
            } else if (!useExisting) {
                break;
            }
        }
        let databasePassword;
        if (useExisting && existingProject) {
            databasePassword = await password({
                message: 'Enter the database password for the existing project (leave blank to skip):',
                mask: '*',
            });
            if (!databasePassword) {
                console.warn('Warning: Database password not provided. Some operations may fail if required.');
            }
        } else {
            while (true) {
                databasePassword = await password({
                    message: 'Enter a database password (min 8 chars, mix of upper, lower, number):',
                    mask: '*',
                    default: generatePassword(16),
                });
                if (!isValidPassword(databasePassword)) {
                    console.error('Password must be at least 8 characters, include upper and lower case letters, and numbers.');
                } else {
                    break;
                }
            }
            console.log('Creating new project...');
            projectRef = await createProject({ projectName, databasePassword });
            await waitForProjectToBeReady({ projectRef });
        }

        console.log('Fetching API keys...');
        let anonKey;
        try {
            ({ anonKey } = await fetchApiKeys({ projectRef }));
        } catch (e) {
            console.error('Failed to fetch anon API key.');
            console.error('Suggestions:');
            console.error('- Check if the project is ready and healthy.');
            console.error('- Ensure you have the correct permissions.');
            console.error('- Try running with DEBUG=* for more details.');
            throw e;
        }

        // Ensure password is present before linking
        if (!databasePassword) {
            databasePassword = await password({
                message: 'Database password is required to link the project. Please enter it now:',
                mask: '*',
            });
            if (!databasePassword) {
                throw new Error('Database password is required for linking. Aborting.');
            }
        }
        console.log('Linking project...');
        await linkProject({
            projectRef,
            databasePassword,
        });

        // Ensure password is present before database setup
        if (!databasePassword) {
            databasePassword = await password({
                message: 'Database password is required to set up the database. Please enter it now:',
                mask: '*',
            });
            if (!databasePassword) {
                throw new Error('Database password is required for database setup. Aborting.');
            }
        }
        console.log('Setting up database...');
        await setupDatabase({
            databasePassword,
        });

        // --- ADVANCED MIGRATIONS ---
        let migrationDir = path.join(process.cwd(), 'supabase', 'migrations');
        const customMigrationDir = await input({
            message: `Migrations directory [default: ${migrationDir}]:`,
            default: migrationDir,
        });
        if (customMigrationDir && customMigrationDir !== migrationDir) {
            migrationDir = customMigrationDir;
        }
        if (existsSync(migrationDir)) {
            const migrationFiles = getMigrationFiles(migrationDir);
            const appliedMigrations = getAppliedMigrations();
            const unappliedMigrations = migrationFiles.filter(f => !appliedMigrations.includes(f));
            if (unappliedMigrations.length > 0) {
                console.log('The following migrations will be pushed (in order):');
                unappliedMigrations.forEach(f => console.log('  - ' + f));
                const shouldPush = await confirm({
                    message: 'Do you want to push these migrations to the remote database?',
                    default: true,
                });
                if (shouldPush) {
                    try {
                        await execa('npx', [
                            'supabase',
                            'db',
                            'push',
                            '--project-ref',
                            projectRef,
                        ], { stdio: 'inherit' });
                        unappliedMigrations.forEach(markMigrationApplied);
                        console.log('Migrations pushed successfully.');
                    } catch (e) {
                        console.error('Failed to push migrations:', e.message || e);
                        throw e;
                    }
                } else {
                    console.log('Migration push cancelled.');
                }
            } else {
                console.log('No new migrations to apply.');
            }
        } else {
            console.log('No migrations directory found.');
        }

        // --- ADVANCED SELECTABLE FUNCTIONS ---
        const functionsDir = path.join(process.cwd(), 'supabase', 'functions');
        if (existsSync(functionsDir)) {
            const functionInfos = getFunctionInfos(functionsDir);
            if (functionInfos.length > 0) {
                const selectedFunctions = await select({
                    message: 'Select functions to deploy (type to filter, space to select, enter to confirm):',
                    choices: functionInfos.map(fn => ({
                        name: `${fn.name} (${fn.entryFile}, modified: ${fn.mtime})`,
                        value: fn.name
                    })),
                    multiple: true,
                });
                for (const fnName of selectedFunctions) {
                    const fnInfo = functionInfos.find(f => f.name === fnName);
                    const shouldDeploy = await confirm({
                        message: `Deploy function ${fnInfo.name} (${fnInfo.entryFile})?`,
                        default: true,
                    });
                    if (shouldDeploy) {
                        await deployFunction(fnInfo.name);
                    } else {
                        console.log(`Skipped function: ${fnInfo.name}`);
                    }
                }
            } else {
                console.log('No deployable functions found.');
            }
        } else {
            console.log('No functions directory found.');
        }

        console.log('Writing environment variables...');
        await persistSupabaseEnv({
            projectRef,
            anonKey,
        });
        console.log('\nSetup complete!');
        console.log('Summary of environment variables written:');
        console.log(`VITE_SUPABASE_URL=https://${projectRef}.supabase.co`);
        console.log(`VITE_SUPABASE_ANON_KEY=${anonKey}`);
    } catch (e) {
        if (e && e.message && e.message.match(/Interrupted|SIGINT/)) {
            console.log('\nOperation cancelled by user.');
        } else {
            console.error('An error occurred:', e.message || e);
            console.error('Tip: Try running with DEBUG=* for more verbose output.');
        }
        process.exit(1);
    }
})();

async function loginToSupabase() {
    await execa('npx', ['supabase', 'login'], { stdio: 'inherit' });
}

async function createProject({ projectName, databasePassword }) {
    try {
        const { stdout } = await execa(
            'npx',
            [
                'supabase',
                'projects',
                'create',
                '--interactive',
                '--output',
                'json',
                '--db-password',
                databasePassword,
                projectName,
            ],
            {
                stdin: 'inherit',
                stdout: ['inherit', 'pipe'],
            }
        );

        const matchJSON = stdout.match(new RegExp('{.*}', 's'));
        if (!matchJSON) {
            throw new Error('Invalid JSON output from supabase projects create. Please check your network connection and try again.');
        }
        const jsonOuput = JSON.parse(matchJSON[0]);
        if (!jsonOuput.id) {
            throw new Error('Project creation response missing project ID.');
        }
        return jsonOuput.id;
    } catch (e) {
        console.error('Failed to create project.');
        console.error(e.message || e);
        throw e;
    }
}

async function waitForProjectToBeReady({ projectRef }) {
    let attempts = 0;
    const maxAttempts = 120; // Wait up to 2 minutes
    while (attempts < maxAttempts) {
        attempts++;
        try {
            console.log('Waiting for project to be ready...');
            const { stdout } = await execa(
                'npx',
                ['supabase', 'projects', 'list', '--output', 'json'],
                {
                    stdout: 'pipe',
                }
            );
            const matchJSON = stdout.match(new RegExp('\\[.*\\]', 's'));
            if (!matchJSON) {
                throw new Error('Invalid JSON output from supabase projects list.');
            }
            const jsonOuput = JSON.parse(matchJSON[0]);
            const project = jsonOuput.find(project => project.id === projectRef);
            if (!project) {
                throw new Error('Project not found in project list.');
            }
            if (project.status === 'ACTIVE_HEALTHY') {
                return;
            }
        } catch (e) {
            console.error('Error while checking project status:', e.message || e);
        }
        await sleep(1000);
    }
    throw new Error('Timed out waiting for project to be ready.');
}

let retry = 0;
const maxRetries = 30;
async function linkProject({ projectRef, databasePassword }) {
    const startTime = Date.now();
    while (retry < maxRetries) {
        try {
            process.stdout.write(`\rLinking project (attempt ${retry + 1}/${maxRetries})... Elapsed: ${Math.floor((Date.now() - startTime) / 1000)}s   `);
            await execa(
                'npx',
                [
                    'supabase',
                    'link',
                    '--project-ref',
                    projectRef,
                    '--password',
                    databasePassword,
                ],
                {
                    stdout: 'ignore',
                    stderr: 'ignore',
                }
            );
            process.stdout.write('\n');
            return;
        } catch {
            retry++;
            if (retry === 5 || retry === 15 || retry === 25) {
                const abort = await confirm({
                    message: `Still trying to link after ${retry} attempts. Do you want to keep waiting?`,
                    default: true,
                });
                if (!abort) {
                    throw new Error('User aborted linking project.');
                }
            }
            await sleep(1000);
        }
    }
    process.stdout.write('\n');
    throw new Error('Failed to link project after multiple attempts. Please check your Supabase project status.');
}

async function setupDatabase({ databasePassword }) {
    try {
        const { stdout } = await execa('npx', [
            'supabase',
            'db',
            'push',
            '--linked',
            '--include-roles',
            // '--password',
            // databasePassword,
        ], {
            stdio: 'pipe', // important to capture output
        });

        console.log('Command succeeded:', stdout);
    } catch (error) {
        console.error('Command failed:', error.message || error);
        if (error.stderr) {
            console.error('stderr:', error.stderr);
        }
        console.error('Please ensure your Supabase CLI is up to date and you have network connectivity.');
    }
}

async function fetchApiKeys({ projectRef }) {
    let anonKey = '';
    let attempts = 0;
    const maxAttempts = 60; // 1 minute
    while (anonKey === '' && attempts < maxAttempts) {
        attempts++;
        try {
            const { stdout, exitCode } = await execa(
                'npx',
                [
                    'supabase',
                    'projects',
                    'api-keys',
                    '--output',
                    'json',
                    '--project-ref',
                    projectRef,
                ],
                {
                    stdout: 'pipe',
                    stderr: 'ignore',
                }
            );
            if (exitCode === 0) {
                const matchJSON = stdout.match(new RegExp('\\[.*\\]', 's'));
                if (!matchJSON) {
                    throw new Error('Invalid JSON output from supabase projects api-keys.');
                }
                const jsonOuput = JSON.parse(matchJSON[0]);
                const anonObj = jsonOuput.find(key => key.name === 'anon');
                if (!anonObj || !anonObj.api_key) {
                    throw new Error('Anon key not found in API keys.');
                }
                anonKey = anonObj.api_key;
            }
        } catch (e) {
            if (attempts % 10 === 0) {
                console.error('Still waiting for API keys...');
            }
        }
        if (anonKey === '') {
            await sleep(1000);
        }
    }
    if (anonKey === '') {
        throw new Error('Failed to fetch anon API key after multiple attempts.');
    }
    return { anonKey };
}

async function persistSupabaseEnv({ projectRef, anonKey }) {
    try {
        fs.writeFileSync(
            `${process.cwd()}/.env.production.local`,
            `\nVITE_SUPABASE_URL=https://${projectRef}.supabase.co\nVITE_SUPABASE_ANON_KEY=${anonKey}`,
            { flag: 'a' }
        );
        console.log('.env.production.local updated successfully.');
    } catch (e) {
        console.error('Failed to write to .env.production.local:', e.message || e);
        throw e;
    }
}

function generatePassword(length) {
    const password = crypto
        // eslint-disable-next-line no-undef
        .getRandomValues(new BigUint64Array(4))
        .reduce(
            (prev, curr, index) =>
                (!index ? prev : prev.toString(36)) +
                (index % 2
                    ? curr.toString(36).toUpperCase()
                    : curr.toString(36))
        )
        .split('')
        .sort(() => 128 - crypto.getRandomValues(new Uint8Array(1))[0])
        .join('');

    if (length) {
        return password.slice(0, length);
    }

    return password;
}

function isValidPassword(password) {
    // At least 8 chars, 1 upper, 1 lower, 1 number
    return (
        typeof password === 'string' &&
        password.length >= 8 &&
        /[a-z]/.test(password) &&
        /[A-Z]/.test(password) &&
        /[0-9]/.test(password)
    );
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function projectNameExists(name) {
    try {
        const { stdout } = await execa(
            'npx',
            ['supabase', 'projects', 'list', '--output', 'json'],
            { stdout: 'pipe' }
        );
        const matchJSON = stdout.match(new RegExp('\\[.*\\]', 's'));
        if (!matchJSON) return false;
        const projects = JSON.parse(matchJSON[0]);
        return projects.some(p => p.name.toLowerCase() === name.trim().toLowerCase());
    } catch (e) {
        console.error('Could not check for existing projects:', e.message || e);
        return false;
    }
}

async function getProjectByName(name) {
    try {
        const { stdout } = await execa(
            'npx',
            ['supabase', 'projects', 'list', '--output', 'json'],
            { stdout: 'pipe' }
        );
        const matchJSON = stdout.match(new RegExp('\\[.*\\]', 's'));
        if (!matchJSON) return null;
        const projects = JSON.parse(matchJSON[0]);
        return projects.find(p => p.name.toLowerCase() === name.trim().toLowerCase()) || null;
    } catch (e) {
        console.error('Could not check for existing projects:', e.message || e);
        return null;
    }
}

async function findProjectsByName(name) {
    try {
        const { stdout } = await execa(
            'npx',
            ['supabase', 'projects', 'list', '--output', 'json'],
            { stdout: 'pipe' }
        );
        const matchJSON = stdout.match(new RegExp('\\[.*\\]', 's'));
        if (!matchJSON) return [];
        const projects = JSON.parse(matchJSON[0]);
        const lower = name.trim().toLowerCase();
        return projects.filter(p => p.name.toLowerCase().includes(lower));
    } catch (e) {
        console.error('Could not check for existing projects:', e.message || e);
        return [];
    }
}

// --- HELPERS ---
function getMigrationFiles(migrationsPath) {
    return readdirSync(migrationsPath)
        .filter(f => f.endsWith('.sql'))
        .sort();
}

function getAppliedMigrations() {
    const file = path.join(process.cwd(), '.migrations_applied.json');
    if (existsSync(file)) {
        try {
            return JSON.parse(readFileSync(file, 'utf-8'));
        } catch {
            return [];
        }
    }
    return [];
}

function markMigrationApplied(migration) {
    const file = path.join(process.cwd(), '.migrations_applied.json');
    let applied = [];
    if (existsSync(file)) {
        try {
            applied = JSON.parse(readFileSync(file, 'utf-8'));
        } catch {
            applied = [];
        }
    }
    if (!applied.includes(migration)) {
        applied.push(migration);
        writeFileSync(file, JSON.stringify(applied, null, 2));
    }
}

function getFunctionInfos(functionsPath) {
    return readdirSync(functionsPath)
        .map(name => {
            const fullPath = path.join(functionsPath, name);
            if (!statSync(fullPath).isDirectory()) return null;
            // Find first .ts or .js file
            const files = readdirSync(fullPath).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
            if (files.length === 0) return null;
            const entryFile = files[0];
            const mtime = statSync(path.join(fullPath, entryFile)).mtime.toISOString();
            return { name, entryFile, mtime };
        })
        .filter(Boolean);
}

async function deployFunction(functionName) {
    console.log(`Deploying function: ${functionName}`);
    try {
        await execa('npx', [
            'supabase',
            'functions',
            'deploy',
            functionName,
        ], { stdio: 'inherit' });
        console.log(`Function deployed: ${functionName}`);
    } catch (e) {
        console.error(`Failed to deploy function ${functionName}:`, e.message || e);
        throw e;
    }
}
