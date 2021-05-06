#!/usr/bin/env make -f

# Disable all default suffixes
.SUFFIXES:

# ----- Default
.PHONY: default

default: build ## Default (build)

# ----- Dependencies
.PHONY: deps

cmd_esbuild := node_modules/.bin/esbuild
cmd_electron := node_modules/.bin/electron
cmd_jest := node_modules/.bin/jest

node_modules: package.json
	$(info Installing node_modules)
	@npm install

$(cmd_esbuild) $(cmd_electron) $(cmd_jest): node_modules

deps: node_modules ## Install dependencies

deps.clean: ## Clean dependencies
	$(info Cleaning dependencies)
	@rm -r node_modules > /dev/null 2>&1 || true


# ----- Build
.PHONY: build build.clean

build_cmd := scripts/build.mjs

build_deps_ts := $(shell find src -name '*.ts')

build_target_main := build/main.js
build_target_render := build/render.js
	
$(build_cmd): $(cmd_esbuild)

build/%.js: src/%.mjs $(build_deps_ts) $(build_cmd)
	$(info Building $@)
	@$(build_cmd) $< $@

build: $(build_target_main) $(build_target_render) ## Build all

build.clean: ## Clean all build artifacts
	$(info Cleaning build artifacts)
	@rm $(build_target_main) > /dev/null 2>&1 || true
	@rm $(build_target_render) > /dev/null 2>&1 || true


# ----- Test
.PHONY: test

test: $(cmd_jest) ## Run tests
	$(info Testing)
	@$(cmd_jest) src


# ----- Run
.PHONY: run

run: $(build_target_main) $(build_target_render) $(cmd_electron) ## Run
	$(info Running)
	@$(cmd_electron) $<


# ----- Clean
.PHONY: clean

clean: build.clean deps.clean ## Clean all

# ----- Help
.PHONY: help

print.%: ; @echo "$($*)"

help: ## Show help information
	@awk -F ':|##' '/^[^\t].+?:.*?##/ {printf "\033[36m%-30s\033[0m %s\n", $$1, $$NF }' $(MAKEFILE_LIST);
