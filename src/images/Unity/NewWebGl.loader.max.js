function createUnityInstance(e, t, r) {
    function n(e, r) {
        if (!n.aborted && t.showBanner) return "error" == r && (n.aborted = !0), t.showBanner(e, r);
        switch (r) {
            case "error":
                console.error(e);
                break;
            case "warning":
                console.warn(e);
                break;
            default:
                console.log(e);
        }
    }
    function o(e) {
        var t = e.reason || e.error,
            r = t ? t.toString() : e.message || e.reason || "",
            n = t && t.stack ? t.stack.toString() : "";
        if ((n.startsWith(r) && (n = n.substring(r.length)), (r += "\n" + n.trim()), r && c.stackTraceRegExp && c.stackTraceRegExp.test(r))) {
            var o = e.filename || (t && (t.fileName || t.sourceURL)) || "",
                a = e.lineno || (t && (t.lineNumber || t.line)) || 0;
            s(r, o, a);
        }
    }
    function a(e) {
        e.preventDefault();
    }
    function s(e, t, r) {
        if (e.indexOf("fullscreen error") == -1) {
            if (c.startupErrorHandler) return void c.startupErrorHandler(e, t, r);
            if (!((c.errorHandler && c.errorHandler(e, t, r)) || (console.log("Invoking error handler due to\n" + e), "function" == typeof dump && dump("Invoking error handler due to\n" + e), s.didShowErrorMessage))) {
                var e = "An error occurred running the Unity content on this page. See your browser JavaScript console for more info. The error was:\n" + e;
                e.indexOf("DISABLE_EXCEPTION_CATCHING") != -1
                    ? (e =
                          "An exception has occurred, but exception handling has been disabled in this build. If you are the developer of this content, enable exceptions in your project WebGL player settings to be able to catch the exception or see the stack trace.")
                    : e.indexOf("Cannot enlarge memory arrays") != -1
                    ? (e = "Out of memory. If you are the developer of this content, try allocating more memory to your WebGL build in the WebGL player settings.")
                    : (e.indexOf("Invalid array buffer length") == -1 && e.indexOf("Invalid typed array length") == -1 && e.indexOf("out of memory") == -1 && e.indexOf("could not allocate memory") == -1) ||
                      (e = "The browser could not allocate enough memory for the WebGL content. If you are the developer of this content, try allocating less memory to your WebGL build in the WebGL player settings."),
                    alert(e),
                    (s.didShowErrorMessage = !0);
            }
        }
    }
    function i(e, t) {
        if ("symbolsUrl" != e) {
            var n = c.downloadProgress[e];
            n || (n = c.downloadProgress[e] = { started: !1, finished: !1, lengthComputable: !1, total: 0, loaded: 0 }),
                "object" != typeof t ||
                    ("progress" != t.type && "load" != t.type) ||
                    (n.started || ((n.started = !0), (n.lengthComputable = t.lengthComputable)), (n.total = t.total), (n.loaded = t.loaded), "load" == t.type && (n.finished = !0));
            var o = 0,
                a = 0,
                s = 0,
                i = 0,
                d = 0;
            for (var e in c.downloadProgress) {
                var n = c.downloadProgress[e];
                if (!n.started) return 0;
                s++, n.lengthComputable ? ((o += n.loaded), (a += n.total), i++) : n.finished || d++;
            }
            var u = s ? (s - d - (a ? (i * (a - o)) / a : 0)) / s : 0;
            r(0.9 * u);
        }
    }
    function d(e) {
        i(e);
        var t = c.cacheControl(c[e]),
            r = c.companyName && c.productName ? c.cachedFetch : c.fetchWithProgress,
            o = c[e],
            a = /file:\/\//.exec(o) ? "same-origin" : void 0,
            s = r(c[e], {
                method: "GET",
                companyName: c.companyName,
                productName: c.productName,
                control: t,
                mode: a,
                onProgress: function (t) {
                    i(e, t);
                },
            });
        return s
            .then(function (e) {
                return e.parsedBody;
            })
            .catch(function (t) {
                var r = "Failed to download file " + c[e];
                "file:" == location.protocol
                    ? n(r + ". Loading web pages via a file:// URL without a web server is not supported by this browser. Please use a local development web server to host Unity content, or use the Unity Build and Run option.", "error")
                    : console.error(r);
            });
    }
    function u() {
        return new Promise(function (e, t) {
            var r = document.createElement("script");
            (r.src = c.frameworkUrl),
                (r.onload = function () {
                    if ("undefined" == typeof unityFramework || !unityFramework) {
                        var t = [
                            ["br", "br"],
                            ["gz", "gzip"],
                        ];
                        for (var o in t) {
                            var a = t[o];
                            if (c.frameworkUrl.endsWith("." + a[0])) {
                                var s = "Unable to parse " + c.frameworkUrl + "!";
                                if ("file:" == location.protocol)
                                    return void n(
                                        s +
                                            " Loading pre-compressed (brotli or gzip) content via a file:// URL without a web server is not supported by this browser. Please use a local development web server to host compressed Unity content, or use the Unity Build and Run option.",
                                        "error"
                                    );
                                if (
                                    ((s +=
                                        ' This can happen if build compression was enabled but web server hosting the content was misconfigured to not serve the file with HTTP Response Header "Content-Encoding: ' +
                                        a[1] +
                                        '" present. Check browser Console and Devtools Network tab to debug.'),
                                    "br" == a[0] && "http:" == location.protocol)
                                ) {
                                    var i = ["localhost", "127.0.0.1"].indexOf(location.hostname) != -1 ? "" : "Migrate your server to use HTTPS.";
                                    s = /Firefox/.test(navigator.userAgent)
                                        ? "Unable to parse " +
                                          c.frameworkUrl +
                                          '!<br>If using custom web server, verify that web server is sending .br files with HTTP Response Header "Content-Encoding: br". Brotli compression may not be supported in Firefox over HTTP connections. ' +
                                          i +
                                          ' See <a href="https://bugzilla.mozilla.org/show_bug.cgi?id=1670675">https://bugzilla.mozilla.org/show_bug.cgi?id=1670675</a> for more information.'
                                        : "Unable to parse " +
                                          c.frameworkUrl +
                                          '!<br>If using custom web server, verify that web server is sending .br files with HTTP Response Header "Content-Encoding: br". Brotli compression may not be supported over HTTP connections. Migrate your server to use HTTPS.';
                                }
                                return void n(s, "error");
                            }
                        }
                        n("Unable to parse " + c.frameworkUrl + "! The file is corrupt, or compression was misconfigured? (check Content-Encoding HTTP Response Header on web server)", "error");
                    }
                    var d = unityFramework;
                    (unityFramework = null), (r.onload = null), e(d);
                }),
                (r.onerror = function (e) {
                    n("Unable to load file " + c.frameworkUrl + "! Check that the file exists on the remote server. (also check browser Console and Devtools Network tab to debug)", "error");
                }),
                document.body.appendChild(r),
                c.deinitializers.push(function () {
                    document.body.removeChild(r);
                });
        });
    }
    function l() {
        u().then(function (e) {
            e(c);
        });
        var e = d("dataUrl");
        c.preRun.push(function () {
            c.addRunDependency("dataUrl"),
                e.then(function (e) {
                    var t = new DataView(e.buffer, e.byteOffset, e.byteLength),
                        r = 0,
                        n = "UnityWebData1.0\0";
                    if (!String.fromCharCode.apply(null, e.subarray(r, r + n.length)) == n) throw "unknown data format";
                    r += n.length;
                    var o = t.getUint32(r, !0);
                    for (r += 4; r < o; ) {
                        var a = t.getUint32(r, !0);
                        r += 4;
                        var s = t.getUint32(r, !0);
                        r += 4;
                        var i = t.getUint32(r, !0);
                        r += 4;
                        var d = String.fromCharCode.apply(null, e.subarray(r, r + i));
                        r += i;
                        for (var u = 0, l = d.indexOf("/", u) + 1; l > 0; u = l, l = d.indexOf("/", u) + 1) c.FS_createPath(d.substring(0, u), d.substring(u, l - 1), !0, !0);
                        c.FS_createDataFile(d, null, e.subarray(a, a + s), !0, !0, !0);
                    }
                    c.removeRunDependency("dataUrl");
                });
        });
    }
    r = r || function () {};
    var c = {
        canvas: e,
        webglContextAttributes: { preserveDrawingBuffer: !1 },
        cacheControl: function (e) {
            return e == c.dataUrl ? "must-revalidate" : "no-store";
        },
        streamingAssetsUrl: "StreamingAssets",
        downloadProgress: {},
        deinitializers: [],
        intervals: {},
        setInterval: function (e, t) {
            var r = window.setInterval(e, t);
            return (this.intervals[r] = !0), r;
        },
        clearInterval: function (e) {
            delete this.intervals[e], window.clearInterval(e);
        },
        preRun: [],
        postRun: [],
        print: function (e) {
            console.log(e);
        },
        printErr: function (e) {
            console.error(e),
                "string" == typeof e &&
                    e.indexOf("wasm streaming compile failed") != -1 &&
                    (e.toLowerCase().indexOf("mime") != -1
                        ? n('HTTP Response Header "Content-Type" configured incorrectly on the server for file ' + c.codeUrl + ' , should be "application/wasm". Startup time performance will suffer.', "warning")
                        : n(
                              'WebAssembly streaming compilation failed! This can happen for example if "Content-Encoding" HTTP header is incorrectly enabled on the server for file ' +
                                  c.codeUrl +
                                  ", but the file is not pre-compressed on disk (or vice versa). Check the Network tab in browser Devtools to debug server header configuration.",
                              "warning"
                          ));
        },
        locateFile: function (e) {
            return "build.wasm" == e ? this.codeUrl : e;
        },
        disabledCanvasEvents: ["contextmenu", "dragstart"],
    };
    for (var f in t) c[f] = t[f];
    c.streamingAssetsUrl = new URL(c.streamingAssetsUrl, document.URL).href;
    var h = c.disabledCanvasEvents.slice();
    h.forEach(function (t) {
        e.addEventListener(t, a);
    }),
        window.addEventListener("error", o),
        window.addEventListener("unhandledrejection", o),
        c.deinitializers.push(function () {
            c.disableAccessToMediaDevices(),
                h.forEach(function (t) {
                    e.removeEventListener(t, a);
                }),
                window.removeEventListener("error", o),
                window.removeEventListener("unhandledrejection", o);
            for (var t in c.intervals) window.clearInterval(t);
            c.intervals = {};
        }),
        (c.QuitCleanup = function () {
            for (var e = 0; e < c.deinitializers.length; e++) c.deinitializers[e]();
            (c.deinitializers = []), "function" == typeof c.onQuit && c.onQuit();
        });
    var p = "",
        g = "";
    document.addEventListener("webkitfullscreenchange", function (t) {
        var r = document.webkitCurrentFullScreenElement;
        r === e ? e.style.width && ((p = e.style.width), (g = e.style.height), (e.style.width = "100%"), (e.style.height = "100%")) : p && ((e.style.width = p), (e.style.height = g), (p = ""), (g = ""));
    });
    var m = {
        Module: c,
        SetFullscreen: function () {
            return c.SetFullscreen ? c.SetFullscreen.apply(c, arguments) : void c.print("Failed to set Fullscreen mode: Player not loaded yet.");
        },
        SendMessage: function () {
            return c.SendMessage ? c.SendMessage.apply(c, arguments) : void c.print("Failed to execute SendMessage: Player not loaded yet.");
        },
        Quit: function () {
            return new Promise(function (e, t) {
                (c.shouldQuit = !0), (c.onQuit = e);
            });
        },
    };
    return (
        (c.SystemInfo = (function () {
            function e(e, t, r) {
                return (e = RegExp(e, "i").exec(t)), e && e[r];
            }
            for (
                var t,
                    r,
                    n,
                    o,
                    a,
                    s,
                    i = navigator.userAgent + " ",
                    d = [
                        ["Firefox", "Firefox"],
                        ["OPR", "Opera"],
                        ["Edg", "Edge"],
                        ["SamsungBrowser", "Samsung Browser"],
                        ["Trident", "Internet Explorer"],
                        ["MSIE", "Internet Explorer"],
                        ["Chrome", "Chrome"],
                        ["CriOS", "Chrome on iOS Safari"],
                        ["FxiOS", "Firefox on iOS Safari"],
                        ["Safari", "Safari"],
                    ],
                    u = 0;
                u < d.length;
                ++u
            )
                if ((r = e(d[u][0] + "[/ ](.*?)[ \\)]", i, 1))) {
                    t = d[u][1];
                    break;
                }
            "Safari" == t && (r = e("Version/(.*?) ", i, 1)), "Internet Explorer" == t && (r = e("rv:(.*?)\\)? ", i, 1) || r);
            for (
                var l = [
                        ["Windows (.*?)[;)]", "Windows"],
                        ["Android ([0-9_.]+)", "Android"],
                        ["iPhone OS ([0-9_.]+)", "iPhoneOS"],
                        ["iPad.*? OS ([0-9_.]+)", "iPadOS"],
                        ["FreeBSD( )", "FreeBSD"],
                        ["OpenBSD( )", "OpenBSD"],
                        ["Linux|X11()", "Linux"],
                        ["Mac OS X ([0-9_.]+)", "MacOS"],
                        ["bot|google|baidu|bing|msn|teoma|slurp|yandex", "Search Bot"],
                    ],
                    c = 0;
                c < l.length;
                ++c
            )
                if ((o = e(l[c][0], i, 1))) {
                    (n = l[c][1]), (o = o.replace(/_/g, "."));
                    break;
                }
            var f = { "NT 5.0": "2000", "NT 5.1": "XP", "NT 5.2": "Server 2003", "NT 6.0": "Vista", "NT 6.1": "7", "NT 6.2": "8", "NT 6.3": "8.1", "NT 10.0": "10" };
            (o = f[o] || o),
                (a = document.createElement("canvas")),
                a &&
                    ((gl = a.getContext("webgl2")),
                    (glVersion = gl ? 2 : 0),
                    gl || ((gl = a && a.getContext("webgl")) && (glVersion = 1)),
                    gl && (s = (gl.getExtension("WEBGL_debug_renderer_info") && gl.getParameter(37446)) || gl.getParameter(7937)));
            var h = "undefined" != typeof SharedArrayBuffer,
                p = "object" == typeof WebAssembly && "function" == typeof WebAssembly.compile;
            return {
                width: screen.width,
                height: screen.height,
                userAgent: i.trim(),
                browser: t || "Unknown browser",
                browserVersion: r || "Unknown version",
                mobile: /Mobile|Android|iP(ad|hone)/.test(navigator.appVersion),
                os: n || "Unknown OS",
                osVersion: o || "Unknown OS Version",
                gpu: s || "Unknown GPU",
                language: navigator.userLanguage || navigator.language,
                hasWebGL: glVersion,
                hasCursorLock: !!document.body.requestPointerLock,
                hasFullscreen: !!document.body.requestFullscreen || !!document.body.webkitRequestFullscreen,
                hasThreads: h,
                hasWasm: p,
                hasWasmThreads: !1,
            };
        })()),
        (c.abortHandler = function (e) {
            return s(e, "", 0), !0;
        }),
        (Error.stackTraceLimit = Math.max(Error.stackTraceLimit || 0, 50)),
        (c.fetchWithProgress = (function () {
            function e(e, t) {
                if (!t) return 0;
                var r = e.headers.get("Content-Encoding"),
                    n = parseInt(e.headers.get("Content-Length"));
                switch (r) {
                    case "br":
                        return Math.round(5 * n);
                    case "gzip":
                        return Math.round(4 * n);
                    default:
                        return n;
                }
            }
            function t(t, r) {
                var n = function () {};
                return (
                    r && r.onProgress && (n = r.onProgress),
                    fetch(t, r).then(function (t) {
                        function r() {
                            return "undefined" == typeof a
                                ? t.arrayBuffer().then(function (e) {
                                      return n({ type: "progress", total: e.length, loaded: 0, lengthComputable: s }), new Uint8Array(e);
                                  })
                                : a.read().then(function (e) {
                                      return e.done
                                          ? o()
                                          : (l + e.value.length <= d.length ? (d.set(e.value, l), (c = l + e.value.length)) : u.push(e.value),
                                            (l += e.value.length),
                                            n({ type: "progress", total: Math.max(i, l), loaded: l, lengthComputable: s }),
                                            r());
                                  });
                        }
                        function o() {
                            if (l === i) return d;
                            if (l < i) return d.slice(0, l);
                            var e = new Uint8Array(l);
                            e.set(d, 0);
                            for (var t = c, r = 0; r < u.length; ++r) e.set(u[r], t), (t += u[r].length);
                            return e;
                        }
                        var a = "undefined" != typeof t.body ? t.body.getReader() : void 0,
                            s = "undefined" != typeof t.headers.get("Content-Length"),
                            i = e(t, s),
                            d = new Uint8Array(i),
                            u = [],
                            l = 0,
                            c = 0;
                        return (
                            s || console.warn("[UnityCache] Response is served without Content-Length header. Please reconfigure server to include valid Content-Length for better download performance."),
                            r().then(function (e) {
                                return n({ type: "load", total: e.length, loaded: e.length, lengthComputable: s }), (t.parsedBody = e), t;
                            })
                        );
                    })
                );
            }
            return t;
        })()),
        (c.UnityCache = (function () {
            function e() {
                function e(e) {
                    var t = e.target.result;
                    if ((t.objectStoreNames.contains(n.name) || t.createObjectStore(n.name), !t.objectStoreNames.contains(r.name))) {
                        var o = t.createObjectStore(r.name, { keyPath: "url" });
                        ["version", "company", "product", "updated", "revalidated", "accessed"].forEach(function (e) {
                            o.createIndex(e, e);
                        });
                    }
                }
                var a = this;
                a.isConnected = new Promise(function (r, n) {
                    function s() {
                        a.openDBTimeout && (clearTimeout(a.openDBTimeout), (a.openDBTimeout = null));
                    }
                    try {
                        a.openDBTimeout = setTimeout(function () {
                            "undefined" == typeof a.database && n(new Error("Could not connect to database: Timeout."));
                        }, 2e3);
                        var i = o.open(t.name, t.version);
                        (i.onupgradeneeded = function (t) {
                            e(t);
                        }),
                            (i.onsuccess = function (e) {
                                s(), (a.database = e.target.result), r();
                            }),
                            (i.onerror = function (e) {
                                s(), (a.database = null), n(new Error("Could not connect to database."));
                            });
                    } catch (e) {
                        s(), (a.database = null), n(new Error("Could not connect to database."));
                    }
                });
            }
            var t = { name: "UnityCache", version: 3 },
                r = { name: "RequestStore", version: 1 },
                n = { name: "WebAssembly", version: 1 },
                o = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
            (e.UnityCacheDatabase = t), (e.RequestStore = r), (e.WebAssemblyStore = n);
            var a = null;
            return (
                (e.getInstance = function () {
                    return a || (a = new e()), a;
                }),
                (e.destroyInstance = function () {
                    return a
                        ? a.close().then(function () {
                              a = null;
                          })
                        : Promise.resolve();
                }),
                (e.clearCache = function () {
                    return e.destroyInstance().then(function () {
                        return new Promise(function (e, r) {
                            var n = o.deleteDatabase(t.name);
                            (n.onsuccess = function () {
                                e();
                            }),
                                (n.onerror = function () {
                                    r(new Error("Could not delete database."));
                                }),
                                (n.onblocked = function () {
                                    r(new Error("Database blocked."));
                                });
                        });
                    });
                }),
                (e.prototype.execute = function (e, t, r) {
                    return this.isConnected.then(
                        function () {
                            return new Promise(
                                function (n, o) {
                                    try {
                                        if (null === this.database) return void o(new Error("indexedDB access denied"));
                                        var a = ["put", "delete", "clear"].indexOf(t) != -1 ? "readwrite" : "readonly",
                                            s = this.database.transaction([e], a),
                                            i = s.objectStore(e);
                                        "openKeyCursor" == t && ((i = i.index(r[0])), (r = r.slice(1)));
                                        var d = i[t].apply(i, r);
                                        (d.onsuccess = function (e) {
                                            n(e.target.result);
                                        }),
                                            (d.onerror = function (e) {
                                                o(e);
                                            });
                                    } catch (e) {
                                        o(e);
                                    }
                                }.bind(this)
                            );
                        }.bind(this)
                    );
                }),
                (e.prototype.loadRequest = function (e) {
                    return this.execute(r.name, "get", [e]);
                }),
                (e.prototype.storeRequest = function (e) {
                    return this.execute(r.name, "put", [e]);
                }),
                (e.prototype.close = function () {
                    return this.isConnected.then(
                        function () {
                            this.database && (this.database.close(), (this.database = null));
                        }.bind(this)
                    );
                }),
                e
            );
        })()),
        (c.cachedFetch = (function () {
            function e(e) {
                console.log("[UnityCache] " + e);
            }
            function t(e) {
                return (t.link = t.link || document.createElement("a")), (t.link.href = e), t.link.href;
            }
            function r(e) {
                var t = window.location.href.match(/^[a-z]+:\/\/[^\/]+/);
                return !t || e.lastIndexOf(t[0], 0);
            }
            function n(e) {
                (e = e || {}),
                    (this.headers = new Headers()),
                    Object.keys(e.headers).forEach(
                        function (t) {
                            this.headers.set(t, e.headers[t]);
                        }.bind(this)
                    ),
                    (this.redirected = e.redirected),
                    (this.status = e.status),
                    (this.statusText = e.statusText),
                    (this.type = e.type),
                    (this.url = e.url),
                    (this.parsedBody = e.parsedBody),
                    Object.defineProperty(this, "ok", {
                        get: function () {
                            return this.status >= 200 && this.status <= 299;
                        }.bind(this),
                    });
            }
            function o(e, t, r, n, o) {
                var a = { url: e, version: d.version, company: t, product: r, updated: n, revalidated: n, accessed: n, response: { headers: {} } };
                return (
                    o &&
                        (o.headers.forEach(function (e, t) {
                            a.response.headers[t] = e;
                        }),
                        ["redirected", "status", "statusText", "type", "url"].forEach(function (e) {
                            a.response[e] = o[e];
                        }),
                        (a.response.parsedBody = o.parsedBody)),
                    a
                );
            }
            function a(e, t) {
                return (!t || !t.method || "GET" === t.method) && (!t || ["must-revalidate", "immutable"].indexOf(t.control) != -1) && !!e.match("^https?://");
            }
            function s(s, l) {
                function c(t, r) {
                    return u(t, r).then(function (t) {
                        return !g.enabled || g.revalidated
                            ? t
                            : 304 === t.status
                            ? ((g.result.revalidated = g.result.accessed),
                              (g.revalidated = !0),
                              h
                                  .storeRequest(g.result)
                                  .then(function () {
                                      e("'" + g.result.url + "' successfully revalidated and served from the indexedDB cache");
                                  })
                                  .catch(function (t) {
                                      e("'" + g.result.url + "' successfully revalidated but not stored in the indexedDB cache due to the error: " + t);
                                  }),
                              new n(g.result.response))
                            : (200 == t.status
                                  ? ((g.result = o(t.url, g.company, g.product, g.accessed, t)),
                                    (g.revalidated = !0),
                                    h
                                        .storeRequest(g.result)
                                        .then(function () {
                                            e("'" + g.result.url + "' successfully downloaded and stored in the indexedDB cache");
                                        })
                                        .catch(function (t) {
                                            e("'" + g.result.url + "' successfully downloaded but not stored in the indexedDB cache due to the error: " + t);
                                        }))
                                  : e("'" + g.result.url + "' request failed with status: " + t.status + " " + t.statusText),
                              t);
                    });
                }
                function f(e) {
                    l &&
                        l.onProgress &&
                        (l.onProgress({ type: "progress", total: e.parsedBody.length, loaded: e.parsedBody.length, lengthComputable: !0 }),
                        l.onProgress({ type: "load", total: e.parsedBody.length, loaded: e.parsedBody.length, lengthComputable: !0 }));
                }
                var h = i.getInstance(),
                    p = t("string" == typeof s ? s : s.url),
                    g = { enabled: a(p, l) };
                return (
                    l && ((g.control = l.control), (g.company = l.company), (g.product = l.product)),
                    (g.result = o(p, g.company, g.product, Date.now())),
                    (g.revalidated = !1),
                    g.enabled
                        ? h
                              .loadRequest(g.result.url)
                              .then(function (t) {
                                  if (!t || t.version !== d.version) return c(s, l);
                                  (g.result = t), (g.result.accessed = Date.now());
                                  var o = new n(g.result.response);
                                  if ("immutable" == g.control) return (g.revalidated = !0), h.storeRequest(g.result), e("'" + g.result.url + "' served from the indexedDB cache without revalidation"), f(o), o;
                                  if (r(g.result.url) && (o.headers.get("Last-Modified") || o.headers.get("ETag")))
                                      return fetch(g.result.url, { method: "HEAD" }).then(function (t) {
                                          return (
                                              (g.revalidated = ["Last-Modified", "ETag"].every(function (e) {
                                                  return !o.headers.get(e) || o.headers.get(e) == t.headers.get(e);
                                              })),
                                              g.revalidated
                                                  ? ((g.result.revalidated = g.result.accessed), h.storeRequest(g.result), e("'" + g.result.url + "' successfully revalidated and served from the indexedDB cache"), f(o), o)
                                                  : c(s, l)
                                          );
                                      });
                                  l = l || {};
                                  var a = l.headers || {};
                                  return (
                                      (l.headers = a),
                                      o.headers.get("Last-Modified")
                                          ? ((a["If-Modified-Since"] = o.headers.get("Last-Modified")), (a["Cache-Control"] = "no-cache"))
                                          : o.headers.get("ETag") && ((a["If-None-Match"] = o.headers.get("ETag")), (a["Cache-Control"] = "no-cache")),
                                      c(s, l)
                                  );
                              })
                              .catch(function (t) {
                                  return e("Failed to load '" + g.result.url + "' from indexedDB cache due to the error: " + t), u(s, l);
                              })
                        : u(s, l)
                );
            }
            var i = c.UnityCache,
                d = i.RequestStore,
                u = c.fetchWithProgress;
            return (
                (n.prototype.arrayBuffer = function () {
                    return Promise.resolve(this.parsedBody.buffer);
                }),
                (n.prototype.blob = function () {
                    return this.arrayBuffer().then(function (e) {
                        return new Blob([e]);
                    });
                }),
                (n.prototype.json = function () {
                    return this.text().then(function (e) {
                        return JSON.parse(e);
                    });
                }),
                (n.prototype.text = function () {
                    var e = new TextDecoder();
                    return Promise.resolve(e.decode(this.parsedBody));
                }),
                s
            );
        })()),
        new Promise(function (e, t) {
            c.SystemInfo.hasWebGL
                ? c.SystemInfo.hasWasm
                    ? (1 == c.SystemInfo.hasWebGL && c.print('Warning: Your browser does not support "WebGL 2" Graphics API, switching to "WebGL 1"'),
                      (c.startupErrorHandler = t),
                      r(0),
                      c.postRun.push(function () {
                          r(1), delete c.startupErrorHandler, e(m);
                      }),
                      l())
                    : t("Your browser does not support WebAssembly.")
                : t("Your browser does not support WebGL.");
        })
    );
}
