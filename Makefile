# KaportApp Makefile - Extended GitHub Release Automation

VERSION := $(shell grep '^version:' pubspec.yaml | awk '{print $$2}')
TAG := v$(VERSION)
DIST_DIR := dist
RELEASE_NOTES := release-notes/$(TAG).md

.PHONY: analyze test build-web build-apk build-aab prepare-release tag-release publish-release clean

analyze:
	@echo "\033[1;34mRunning flutter analyze...\033[0m"
	@flutter analyze

test:
	@echo "\033[1;34mRunning flutter tests...\033[0m"
	@flutter test --coverage

build: build-web build-apk build-aab
	@echo "\033[1;32m✅ All builds completed successfully.\033[0m"

build-web:
	@echo "\033[1;32mBuilding Flutter web release...\033[0m"
	@flutter build web --release
	@rm -rf $(DIST_DIR)/web
	@mkdir -p $(DIST_DIR)/web
	@cp -R build/web/* $(DIST_DIR)/web/

build-apk:
	@echo "\033[1;32mBuilding Flutter APK release...\033[0m"
	@flutter build apk --release
	@mkdir -p $(DIST_DIR)
	@cp build/app/outputs/flutter-apk/app-release.apk $(DIST_DIR)/app-release.apk

build-aab:
	@echo "\033[1;32mBuilding Android App Bundle (.aab)...\033[0m"
	@flutter build appbundle --release
	@test -f build/app/outputs/bundle/release/app-release.aab || (echo "❌ AAB file not found!" && exit 1)
	@mkdir -p $(DIST_DIR)
	@cp build/app/outputs/bundle/release/app-release.aab $(DIST_DIR)/kaportapp-$(TAG).aab

prepare-release: analyze test build-web build-apk build-aab
	@echo "\033[1;32mPreparing release artifacts in $(DIST_DIR)...\033[0m"
	@rm -f $(DIST_DIR)/web.zip
	@cd $(DIST_DIR) && zip -r web.zip web

tag-release:
	@echo "\033[1;32mTagging repository with $(TAG)...\033[0m"
	@git tag -a $(TAG) -m "KaportApp $(TAG)"
	@git push origin $(TAG)

publish-release:
	@if [ ! -f "$(RELEASE_NOTES)" ]; then \
		echo "\033[1;31m❌ Release notes not found: $(RELEASE_NOTES)\033[0m"; \
		exit 1; \
	fi
	@echo "\033[1;32mPublishing GitHub release $(TAG)...\033[0m"
	@command -v gh >/dev/null 2>&1 || (echo "❌ GitHub CLI (gh) not found. Install it from https://cli.github.com/" && exit 1)
	@gh release create $(TAG) \
		--title "KaportApp $(TAG)" \
		--notes-file "$(RELEASE_NOTES)" \
		$(DIST_DIR)/app-release.apk \
		$(DIST_DIR)/kaportapp-$(TAG).aab \
		$(DIST_DIR)/web.zip

clean:
	@echo "\033[1;33mCleaning build artifacts...\033[0m"
	@flutter clean
	@rm -rf $(DIST_DIR)

# Usage information

Usage:
	make build-aab         Build Android App Bundle (.aab)
	make prepare-release   Build all artifacts for release
	make publish-release   Push artifacts to GitHub Releases
