# KaportApp Makefile

VERSION := $(shell grep 'version:' pubspec.yaml | awk '{print $$2}')
DIST_DIR := dist

.PHONY: analyze test build-web build-apk build-aab prepare-release publish-release tag-release clean

analyze:
	@echo "\033[1;34mRunning flutter analyze...\033[0m"
	@flutter analyze

test:
	@echo "\033[1;34mRunning flutter tests...\033[0m"
	@flutter test --coverage

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
	@cp build/app/outputs/bundle/release/app-release.aab $(DIST_DIR)/kaportapp-v$(VERSION).aab

prepare-release: analyze test build-web build-apk build-aab
	@echo "\033[1;32mPreparing release artifacts in $(DIST_DIR)...\033[0m"
	@rm -f $(DIST_DIR)/web.zip
	@cd $(DIST_DIR) && zip -r web.zip web

tag-release:
	@echo "\033[1;32mTagging repository with $(VERSION)...\033[0m"
	@git tag -a $(VERSION) -m "KaportApp $(VERSION)"
	@git push origin $(VERSION)

publish-release:
	@echo "\033[1;32mPublishing GitHub release $(VERSION)...\033[0m"
	@gh release create $(VERSION) $(DIST_DIR)/app-release.apk $(DIST_DIR)/kaportapp-v$(VERSION).aab $(DIST_DIR)/web.zip -t "KaportApp $(VERSION)"

clean:
	@echo "\033[1;33mCleaning build artifacts...\033[0m"
	@flutter clean
	@rm -rf $(DIST_DIR)

# Usage information

Usage:
	make build-aab         Build Android App Bundle (.aab)
	make prepare-release   Build all artifacts for release
	make publish-release   Push artifacts to GitHub Releases
