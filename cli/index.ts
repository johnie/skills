#!/usr/bin/env bun
import { run } from "@stricli/core";
import { app } from "./app";
import { buildContext } from "./context";

const args = process.argv.slice(2);

const commandArgs = args.length === 0 ? ["interactive"] : args;

await run(app, commandArgs, buildContext(process));
