import AppKit
import WebKit

// Keep the companion inside the visible screen, with a gap from the click point.
func cursorCompanionOrigin(pointer: NSPoint, bounds: NSRect, size: NSSize) -> NSPoint {
    let right = pointer.x + 18
    let x = right + size.width <= bounds.maxX ? right : pointer.x - size.width - 18
    let y = pointer.y - size.height - 12
    return NSPoint(x: max(bounds.minX, min(bounds.maxX - size.width, x)),
                   y: max(bounds.minY, min(bounds.maxY - size.height, y)))
}

func restingCornerOrigin(frame: NSRect, bounds: NSRect) -> NSPoint {
    let xInset = min(8, max(0, (bounds.width - frame.width) / 2))
    let yInset = min(8, max(0, bounds.height - frame.height))
    let left = bounds.minX + xInset
    let right = max(left, bounds.maxX - frame.width - xInset)
    return NSPoint(x: frame.midX < bounds.midX ? left : right, y: bounds.minY + yInset)
}

func fittedStayFrame(_ frame: NSRect, artwork: NSRect, visibleBounds: [NSRect]) -> NSRect {
    let onScreen = artwork.offsetBy(dx: frame.minX, dy: frame.minY)
    guard let bounds = visibleBounds.max(by: { a, b in
        let intersectionA = a.intersection(onScreen)
        let intersectionB = b.intersection(onScreen)
        return intersectionA.width * intersectionA.height < intersectionB.width * intersectionB.height
    }) else { return frame }
    return NSRect(x: max(bounds.minX, min(bounds.maxX - frame.width, frame.minX)),
                  y: max(bounds.minY - artwork.minY, min(bounds.maxY - artwork.maxY, frame.minY)),
                  width: frame.width, height: frame.height)
}

func petToolbarFrame(window: NSRect, artwork: NSRect, visibleBounds: NSRect, following: Bool) -> NSRect {
    let width: CGFloat = following ? 40 : 326
    let height: CGFloat = 39
    let area = window.intersection(visibleBounds)
    let pet = artwork.offsetBy(dx: window.minX, dy: window.minY)
    let below = pet.minY - height - 5
    let preferred = below >= area.minY + 4 ? below : pet.maxY + 5
    let y = max(area.minY + 4, min(area.maxY - height - 4, preferred))
    return NSRect(x: window.midX - width / 2, y: y, width: width, height: height)
}

private struct SavedPerch: Codable {
    let x: Double
    let y: Double
}

final class PetWindow: NSPanel {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { false }
    // The Swift placement rule allows transparent space to extend past the display.
    override func constrainFrameRect(_ frameRect: NSRect, to screen: NSScreen?) -> NSRect { frameRect }
}

final class PetApp: NSObject, NSApplicationDelegate, WKScriptMessageHandler, WKNavigationDelegate {
    var window: PetWindow!
    var web: WKWebView!
    var item: NSStatusItem!
    var paused = false
    var following = false
    var followMoving = false
    var lastPointer: NSPoint?
    var lastPointerAt: TimeInterval?
    var followAllowed = true
    var approachUntil: TimeInterval = 0
    var artwork: NSRect?
    var stayArtwork: NSRect?
    var pendingPerch: NSPoint?
    var toolbarTop: Int?
    var toolbarUntil: TimeInterval = 0
    var homeLevel: NSWindow.Level = .floating
    var homeFrame: NSRect?
    var stayMenuItem: NSMenuItem?
    var passThroughMenuItem: NSMenuItem?
    var soundMenuItem: NSMenuItem?
    var pinMenuItem: NSMenuItem?
    var followMenuItem: NSMenuItem?
    var fortuneMenuItem: NSMenuItem?
    var pauseMenuItem: NSMenuItem?
    var saveURL: URL!
    var perchURL: URL!
    var resources: URL!

    func applicationDidFinishLaunching(_ notification: Notification) {
        resources = Bundle.main.resourceURL!
        let override = ProcessInfo.processInfo.environment["ODDLINGS_DESKTOP_DATA_DIR"]
        let folder = override.map { URL(fileURLWithPath: $0, isDirectory: true) } ??
            FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("LittleOddlings", isDirectory: true)
        do { try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true) }
        catch { NSLog("Could not prepare pet storage: %@", String(describing: error)) }
        saveURL = folder.appendingPathComponent("pet-save.json")
        perchURL = folder.appendingPathComponent("desk-perch.json")
        let bounds = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1000, height: 700)
        let stayFrame = NSRect(x: bounds.maxX - 380, y: bounds.minY + 30, width: 340, height: 240)
        if let data = try? Data(contentsOf: perchURL), data.count <= 1024,
           let saved = try? JSONDecoder().decode(SavedPerch.self, from: data),
           saved.x.isFinite, saved.y.isFinite {
            pendingPerch = NSPoint(x: saved.x, y: saved.y)
        }
        window = PetWindow(contentRect: stayFrame, styleMask: [.borderless, .nonactivatingPanel], backing: .buffered, defer: false)
        window.isOpaque = false
        window.backgroundColor = .clear
        window.hasShadow = false
        window.level = .floating
        window.hidesOnDeactivate = false
        window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        window.isReleasedWhenClosed = false
        let config = WKWebViewConfiguration()
        config.userContentController.add(self, name: "pet")
        config.mediaTypesRequiringUserActionForPlayback = []
        web = WKWebView(frame: NSRect(x: 0, y: 0, width: 340, height: 240), configuration: config)
        web.setValue(false, forKey: "drawsBackground")
        web.navigationDelegate = self
        web.autoresizingMask = [.width, .height]
        window.contentView = web
        web.loadFileURL(resources.appendingPathComponent("pet.html"), allowingReadAccessTo: resources)
        window.orderFrontRegardless()
        item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        item.button?.title = "◉"
        item.button?.setAccessibilityLabel("桌面小夥伴")
        let menu = NSMenu()
        menu.autoenablesItems = false
        @discardableResult
        func add(_ title: String, _ action: Selector, command: String? = nil, key: String = "") -> NSMenuItem {
            let entry = NSMenuItem(title: title, action: action, keyEquivalent: key)
            entry.target = self
            entry.representedObject = command
            menu.addItem(entry)
            return entry
        }
        stayMenuItem = add("Stay Here", #selector(selectStay))
        stayMenuItem?.state = .on
        followMenuItem = add("Follow Cursor", #selector(selectFollow))
        menu.addItem(.separator())
        add("Change Pet", #selector(petCommand(_:)), command: "change")
        fortuneMenuItem = add("求籤", #selector(drawPetFortune))
        add("Play Ball", #selector(petCommand(_:)), command: "invite-toy")
        add("Share Snack", #selector(petCommand(_:)), command: "snack-toy")
        add("Comfort", #selector(petCommand(_:)), command: "comfort")
        add("Rest", #selector(petCommand(_:)), command: "nap")
        add("Replay Discovered Scene", #selector(petCommand(_:)), command: "replay-egg")
        menu.addItem(.separator())
        soundMenuItem = add("Sound", #selector(petCommand(_:)), command: "sound")
        pinMenuItem = add("Always on Top", #selector(petCommand(_:)), command: "pin")
        pinMenuItem?.state = .on
        pauseMenuItem = add("Pause Animation", #selector(togglePause))
        passThroughMenuItem = add("Click Through", #selector(togglePassThrough))
        add("Show Pet", #selector(showPet))
        add("Hide Pet", #selector(hidePet))
        menu.addItem(.separator())
        add("Quit Little Oddlings", #selector(quit), key: "q")
        item.menu = menu
        let timer = Timer(timeInterval: 0.05, repeats: true) { [weak self] _ in
            self?.pointerStep(at: NSEvent.mouseLocation, now: ProcessInfo.processInfo.systemUptime)
        }
        RunLoop.main.add(timer, forMode: .common)
    }

    @objc func showPet() {
        if !following {
            window.ignoresMouseEvents = false
            passThroughMenuItem?.state = .off
        }
        window.orderFrontRegardless()
        web.evaluateJavaScript("window.__petNative('visible',true)")
    }

    @objc func hidePet() {
        dismissToolbar()
        web.evaluateJavaScript("window.__petNative('visible',false)")
        window.orderOut(nil)
    }

    @objc func selectStay() {
        setFollowing(false)
        showPet()
    }

    @objc func selectFollow() {
        setFollowing(true)
        showPet()
    }

    @objc func drawPetFortune() {
        guard !paused else { return }
        if following { setFollowing(false) }
        if !window.isVisible { showPet() }
        let frame = window.frame
        guard let screen = window.screen else { return }
        let visible = frame.intersection(screen.visibleFrame)
        guard !visible.isEmpty else { return }
        let top = max(0, frame.maxY - visible.maxY)
        let bottom = max(0, visible.minY - frame.minY)
        web.evaluateJavaScript("window.__petNative('fortune', {top: \(top), bottom: \(bottom)})")
    }

    @objc func petCommand(_ sender: NSMenuItem) {
        guard let command = sender.representedObject as? String else { return }
        web.evaluateJavaScript("window.__petNative('command', '\(command)')")
    }

    @objc func togglePause() {
        paused.toggle()
        fortuneMenuItem?.isEnabled = !paused
        pauseMenuItem?.state = paused ? .on : .off
        web.evaluateJavaScript("window.__petNative('pause', \(paused ? "true" : "false"))")
    }

    func setFollowing(_ enabled: Bool) {
        guard enabled != following else { return }
        dismissToolbar()
        artwork = nil
        approachUntil = 0
        lastPointer = nil; lastPointerAt = nil
        following = enabled
        followMenuItem?.state = enabled ? .on : .off
        stayMenuItem?.state = enabled ? .off : .on
        passThroughMenuItem?.state = enabled ? .on : .off
        if enabled {
            homeFrame = window.frame
            homeLevel = window.level
            window.level = .floating
            window.setContentSize(NSSize(width: 170, height: 170))
            window.ignoresMouseEvents = true
            if let screen = NSScreen.screens.first(where: { $0.frame.contains(NSEvent.mouseLocation) }) {
                window.setFrameOrigin(cursorCompanionOrigin(pointer: NSEvent.mouseLocation, bounds: screen.visibleFrame, size: window.frame.size))
            }
            window.orderFrontRegardless()
            followAllowed = true
        } else {
            window.level = homeLevel
            window.ignoresMouseEvents = false
            if let saved = homeFrame {
                window.setFrame(fitStay(saved), display: true)
            }
            setFollowMoving(false)
        }
        web.frame = NSRect(origin: .zero, size: window.contentLayoutRect.size)
        window.contentView?.layoutSubtreeIfNeeded()
        web.evaluateJavaScript("window.__petNative('visible',true)")
        web.evaluateJavaScript("window.__petNative('following', \(enabled ? "true" : "false"))")
    }
    func setFollowMoving(_ moving: Bool) {
        guard moving != followMoving else { return }
        followMoving = moving
        web.evaluateJavaScript("window.__petNative('follow-moving', \(moving ? "true" : "false"))")
    }
    func fitStay(_ frame: NSRect, on screen: NSScreen? = nil) -> NSRect {
        let bounds = screen.map { [$0.visibleFrame] } ?? NSScreen.screens.map(\.visibleFrame)
        let fit = stayArtwork ?? NSRect(origin: .zero, size: frame.size)
        return fittedStayFrame(frame, artwork: fit, visibleBounds: bounds)
    }
    func showToolbar(top: Int?) {
        guard toolbarTop != top else { return }
        toolbarTop = top
        web.evaluateJavaScript("window.__petNative('toolbar', \(top.map(String.init) ?? "null"))")
    }
    func dismissToolbar() {
        toolbarUntil = 0
        showToolbar(top: nil)
        if following { window.ignoresMouseEvents = true }
    }
    func updateToolbar(at point: NSPoint, now: TimeInterval) {
        guard window.isVisible, let artwork, let screen = window.screen,
              following || !window.ignoresMouseEvents else { dismissToolbar(); return }
        let frame = window.frame
        let pet = artwork.offsetBy(dx: frame.minX, dy: frame.minY)
        let bar = petToolbarFrame(window: frame, artwork: artwork, visibleBounds: screen.visibleFrame, following: following)
        let overPet = pet.contains(point)
        let overBar = toolbarTop != nil && bar.insetBy(dx: -3, dy: -5).contains(point)
        let holdingButton = toolbarTop != nil && NSEvent.pressedMouseButtons & 1 != 0
        if overPet || overBar || holdingButton { toolbarUntil = now + 0.28 }
        if following { window.ignoresMouseEvents = !(overPet || overBar || holdingButton) }
        showToolbar(top: now < toolbarUntil ? Int((frame.maxY - bar.maxY).rounded()) : nil)
    }
    func pointerStep(at point: NSPoint, now: TimeInterval) {
        updateToolbar(at: point, now: now)
        guard following, !paused, window.isVisible else { setFollowMoving(false); return }
        guard let screen = NSScreen.screens.first(where: { $0.frame.contains(point) }) else { setFollowMoving(false); return }
        let target = cursorCompanionOrigin(pointer: point, bounds: screen.visibleFrame, size: window.frame.size)
        let current = window.frame.origin
        let dx = target.x - current.x, dy = target.y - current.y
        var speed = 0.0
        if let previous = lastPointer, let at = lastPointerAt, now - at < 0.5 {
            speed = hypot(point.x - previous.x, point.y - previous.y) / max(0.01, now - at)
            if let artwork {
                let center = NSPoint(x: current.x + artwork.midX, y: current.y + artwork.midY)
                let distance = hypot(point.x - center.x, point.y - center.y)
                let previousDistance = hypot(previous.x - center.x, previous.y - center.y)
                // Give the pointer time to reach the pet when moving deliberately towards it.
                let reach = hypot(window.frame.width, window.frame.height) * 0.8
                if distance < reach && previousDistance - distance > 1.5 { approachUntil = now + 0.26 }
                if distance >= reach { approachUntil = 0 }
            }
        }
        lastPointer = point; lastPointerAt = now
        guard toolbarTop == nil, now >= approachUntil else { setFollowMoving(false); return }
        web.evaluateJavaScript("window.__petNative('pointer-motion',{speed: \(speed), distance: \(hypot(dx,dy))})")
        guard followAllowed else { setFollowMoving(false); return }
        let moving = hypot(dx,dy) > 1
        setFollowMoving(moving)
        // Snap across screen boundaries; ease locally without capturing input.
        if window.screen?.frame != screen.frame { window.setFrameOrigin(target) }
        else { window.setFrameOrigin(moving ? NSPoint(x: current.x + dx * 0.35, y: current.y + dy * 0.35) : target) }
    }
    @objc func togglePassThrough() {
        guard !following else { return }
        window.ignoresMouseEvents.toggle()
        passThroughMenuItem?.state = window.ignoresMouseEvents ? .on : .off
    }

    @objc func quit() { NSApplication.shared.terminate(nil) }

    func applicationDidChangeScreenParameters(_ notification: Notification) {
        dismissToolbar()
        guard !following, let window else { return }
        window.setFrame(fitStay(window.frame), display: true)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame, message.frameInfo.request.url?.isFileURL == true,
              let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
        switch type {
        case "load":
            if !FileManager.default.fileExists(atPath: saveURL.path) {
                web.evaluateJavaScript("window.__petRestore(null)")
            } else {
                do {
                    let data = try Data(contentsOf: saveURL)
                    guard data.count <= 200000 else { throw CocoaError(.fileReadCorruptFile) }
                    let object = try JSONSerialization.jsonObject(with: data)
                    let normalized = try JSONSerialization.data(withJSONObject: object, options: [.fragmentsAllowed])
                    let json = String(data: normalized, encoding: .utf8)!
                    web.evaluateJavaScript("window.__petRestore(\(json))")
                } catch {
                    // Leave an unreadable file untouched and refuse to overwrite it.
                    web.evaluateJavaScript("window.__petRestore({})")
                }
            }
        case "save":
            guard let json = body["state"] as? String, let data = json.data(using: .utf8), data.count <= 200000,
                  let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any], object["version"] as? Int == 2 else { return }
            do { try data.write(to: saveURL, options: .atomic); web.evaluateJavaScript("window.__petNative('save-ok',true)") }
            catch { web.evaluateJavaScript("window.__petNative('save-error',true)") }
        case "follow": setFollowing(body["value"] as? Bool == true)
        case "follow-tick": followAllowed = body["allowed"] as? Bool == true
        case "artwork":
            guard body["following"] as? Bool == following else { return }
            guard let x = body["x"] as? Double, let y = body["y"] as? Double,
                  let width = body["width"] as? Double, let height = body["height"] as? Double,
                  [x, y, width, height].allSatisfy(\.isFinite),
                  width > 0, height > 0 else { artwork = nil; dismissToolbar(); return }
            let measured = NSRect(x: x, y: y, width: width, height: height)
            guard NSRect(origin: .zero, size: window.frame.size).contains(measured) else { return }
            artwork = measured
            if !following, body["stationary"] as? Bool == true {
                let oldArtwork = stayArtwork
                stayArtwork = measured
                var frame = window.frame
                if let saved = pendingPerch {
                    frame.origin = saved
                    pendingPerch = nil
                } else if oldArtwork == measured {
                    return
                }
                let fitted = fitStay(frame)
                if fitted != window.frame { window.setFrame(fitted, display: true) }
            }
        case "fortune": drawPetFortune()
        case "pause": togglePause()
        case "drag":
            guard !following, window.isVisible,
                  let dx = body["dx"] as? Double, let dy = body["dy"] as? Double,
                  dx.isFinite, dy.isFinite else { return }
            let screen = NSScreen.screens.first(where: { $0.frame.contains(NSEvent.mouseLocation) })
                ?? window.screen ?? NSScreen.main
            guard let screen else { return }
            var requested = window.frame
            requested.origin.x += max(-200, min(200, dx))
            requested.origin.y -= max(-200, min(200, dy))
            window.setFrameOrigin(fitStay(requested, on: screen).origin)
        case "drag-end":
            guard !following, window.isVisible else { return }
            let origin = window.frame.origin
            let perch = SavedPerch(x: origin.x, y: origin.y)
            do { try JSONEncoder().encode(perch).write(to: perchURL, options: .atomic) }
            catch { NSLog("Could not save the desk perch: %@", String(describing: error)) }
        case "pin":
            let pinned = body["value"] as? Bool == true
            homeLevel = pinned ? .floating : .normal
            if !following { window.level = homeLevel }
            pinMenuItem?.state = pinned ? .on : .off
        case "sound":
            soundMenuItem?.state = body["value"] as? Bool == true ? .on : .off
        case "hide": hidePet()
        default: break
        }
    }
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else { decisionHandler(.cancel); return }
        // Only bundled local documents may use the native bridge. No remote navigation.
        decisionHandler(url.isFileURL && url.standardizedFileURL.path.hasPrefix(resources.path + "/") ? .allow : .cancel)
    }
}
if CommandLine.arguments.contains("--test-follow-geometry") {
    let size = NSSize(width: 170, height: 170)
    for bounds in [NSRect(x: 0, y: 25, width: 1280, height: 740), NSRect(x: -1440, y: -300, width: 1440, height: 900)] {
        for x in [bounds.minX, bounds.maxX - size.width] {
            let frame = NSRect(x: x, y: bounds.midY, width: size.width, height: size.height)
            let corner = restingCornerOrigin(frame: frame, bounds: bounds)
            assert(bounds.contains(NSRect(origin: corner, size: size)))
            assert(corner.y == bounds.minY + 8)
            assert(corner.x == (x == bounds.minX ? bounds.minX + 8 : bounds.maxX - size.width - 8))
        }
        for pointer in [NSPoint(x: bounds.minX, y: bounds.minY), NSPoint(x: bounds.maxX, y: bounds.maxY), NSPoint(x: bounds.midX, y: bounds.midY)] {
            let origin = cursorCompanionOrigin(pointer: pointer, bounds: bounds, size: size)
            assert(bounds.contains(NSRect(origin: origin, size: size)))
            assert(!NSRect(origin: origin, size: size).contains(pointer))
        }
    }
    let mainBounds = NSRect(x: 0, y: 25, width: 1280, height: 740)
    let secondBounds = NSRect(x: -1440, y: -300, width: 1440, height: 900)
    let perch = NSRect(x: -1100, y: 0, width: 340, height: 240)
    let artwork = NSRect(x: 73, y: 49, width: 194, height: 138)
    assert(fittedStayFrame(perch, artwork: artwork, visibleBounds: [mainBounds, secondBounds]) == perch)
    for bounds in [mainBounds, secondBounds] {
        for top in [false, true] {
            let requested = NSRect(x: bounds.midX, y: top ? bounds.maxY : bounds.minY - 200,
                                   width: perch.width, height: perch.height)
            let fitted = fittedStayFrame(requested, artwork: artwork, visibleBounds: [bounds])
            let pet = artwork.offsetBy(dx: fitted.minX, dy: fitted.minY)
            assert(top ? pet.maxY == bounds.maxY : pet.minY == bounds.minY)
            assert(fittedStayFrame(fitted, artwork: artwork, visibleBounds: [mainBounds, secondBounds]) == fitted)
            let bar = petToolbarFrame(window: fitted, artwork: artwork, visibleBounds: bounds, following: false)
            assert(bounds.contains(bar) && fitted.contains(bar))
            assert(top ? bar.maxY < pet.minY : bar.minY > pet.maxY)
        }
    }
    let migrated = fittedStayFrame(perch, artwork: artwork, visibleBounds: [mainBounds])
    assert(mainBounds.contains(artwork.offsetBy(dx: migrated.minX, dy: migrated.minY)))
    print("Cursor placement, screen-edge perches, and toolbar geometry passed.")
    exit(0)
}
let app = NSApplication.shared
app.setActivationPolicy(.accessory)
let delegate = PetApp()
app.delegate = delegate
app.run()
