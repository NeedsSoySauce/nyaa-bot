import { error } from './util.js';

export const getEnvironmentVariable = (name: string) => process.env[name] ?? error(`No environment variable with name ${name} was found`)

