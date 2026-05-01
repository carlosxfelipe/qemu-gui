import * as Gtk from "@gtkx/ffi/gtk";
import * as Pango from "@gtkx/ffi/pango";
import {
  GtkApplicationWindow,
  GtkBox,
  GtkButton,
  GtkImage,
  GtkLabel,
  quit,
} from "@gtkx/react";
import { useState, useEffect, useRef } from "react";
import {
  checkKvmSupport,
  pickIso,
  runQemu,
  QemuConfig,
} from "./systemInterop.js";
import { IconButton } from "./IconButton.js";

export const App = () => {
  const [isoPath, setIsoPath] = useState<string>("");
  const [ram, setRam] = useState<string>("4G");
  const [cores, setCores] = useState<number>(2);
  const [useKvm, setUseKvm] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("Ready");
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const windowRef = useRef<Gtk.Window | null>(null);

  useEffect(() => {
    checkKvmSupport().then((supported: boolean) => {
      setUseKvm(supported);
      if (!supported) {
        setStatus("Warning: KVM not detected. Performance will be slow.");
      }
    });
  }, []);

  const handlePickIso = async () => {
    if (!windowRef.current) return;
    const path = await pickIso(windowRef.current);
    if (path) {
      setIsoPath(path);
      setStatus(`ISO Selected: ${path.split("/").pop()}`);
    }
  };

  const handleRun = () => {
    if (!isoPath) {
      setStatus("Error: Please select an ISO first.");
      return;
    }

    const config: QemuConfig = {
      isoPath,
      ram,
      cores,
    };

    setStatus("Starting QEMU...");
    setIsRunning(true);

    try {
      runQemu(config, useKvm);
      setStatus("QEMU is running.");
    } catch (e: unknown) {
      const err = e as Error;
      setStatus(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <GtkApplicationWindow
      title="QEMU Launcher"
      defaultWidth={500}
      defaultHeight={400}
      onClose={quit}
      // @ts-ignore - Assuming ref is supported or I can get it from somewhere
      ref={windowRef}
    >
      <GtkBox
        orientation={Gtk.Orientation.VERTICAL}
        spacing={12}
        marginTop={24}
        marginBottom={24}
        marginStart={24}
        marginEnd={24}
      >
        {/* Header */}
        <GtkBox
          orientation={Gtk.Orientation.VERTICAL}
          spacing={4}
          marginBottom={16}
        >
          <GtkLabel
            label="QEMU Launcher"
            cssClasses={["title-1"]}
            halign={Gtk.Align.START}
          />
          <GtkLabel
            label="Configure and run your virtual machine"
            cssClasses={["dim-label", "body"]}
            halign={Gtk.Align.START}
          />
        </GtkBox>

        {/* ISO Selection Card */}
        <GtkBox orientation={Gtk.Orientation.VERTICAL} cssClasses={["card"]}>
          <GtkBox
            orientation={Gtk.Orientation.VERTICAL}
            spacing={10}
            marginTop={16}
            marginBottom={16}
            marginStart={16}
            marginEnd={16}
          >
            <GtkBox orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
              <GtkImage
                iconName="media-optical-symbolic"
                iconSize={Gtk.IconSize.NORMAL}
              />
              <GtkLabel
                label="ISO Image"
                cssClasses={["bold", "body"]}
                halign={Gtk.Align.START}
              />
            </GtkBox>
            <GtkBox orientation={Gtk.Orientation.HORIZONTAL} spacing={10}>
              <GtkLabel
                label={isoPath || "No ISO selected"}
                hexpand
                halign={Gtk.Align.START}
                cssClasses={["iso-path-label", "caption"]}
                ellipsize={Pango.EllipsizeMode.END}
              />
              <IconButton
                iconName="folder-open-symbolic"
                label="Browse..."
                onClick={handlePickIso}
              />
            </GtkBox>
          </GtkBox>
        </GtkBox>

        {/* Configuration Card */}
        <GtkBox
          orientation={Gtk.Orientation.VERTICAL}
          cssClasses={["card"]}
          marginTop={10}
        >
          <GtkBox
            orientation={Gtk.Orientation.VERTICAL}
            spacing={16}
            marginTop={16}
            marginBottom={16}
            marginStart={16}
            marginEnd={16}
          >
            <GtkBox orientation={Gtk.Orientation.HORIZONTAL} spacing={8}>
              <GtkImage
                iconName="emblem-system-symbolic"
                iconSize={Gtk.IconSize.NORMAL}
              />
              <GtkLabel
                label="System Configuration"
                cssClasses={["bold", "body"]}
                halign={Gtk.Align.START}
              />
            </GtkBox>

            {/* RAM Selection */}
            <GtkBox orientation={Gtk.Orientation.HORIZONTAL} spacing={10}>
              <GtkBox
                orientation={Gtk.Orientation.HORIZONTAL}
                spacing={8}
                hexpand
              >
                <GtkImage
                  iconName="media-flash-symbolic"
                  iconSize={Gtk.IconSize.NORMAL}
                />
                <GtkLabel label="Memory (RAM):" halign={Gtk.Align.START} />
              </GtkBox>
              <GtkBox orientation={Gtk.Orientation.HORIZONTAL} spacing={4}>
                {["2G", "4G", "8G", "16G"].map((v) => (
                  <GtkButton
                    key={v}
                    label={v}
                    onClicked={() => setRam(v)}
                    cssClasses={
                      ram === v ? ["suggested-action", "pill"] : ["pill"]
                    }
                  />
                ))}
              </GtkBox>
            </GtkBox>

            {/* Cores Selection */}
            <GtkBox orientation={Gtk.Orientation.HORIZONTAL} spacing={10}>
              <GtkBox
                orientation={Gtk.Orientation.HORIZONTAL}
                spacing={8}
                hexpand
              >
                <GtkImage
                  iconName="cpu-symbolic"
                  iconSize={Gtk.IconSize.NORMAL}
                />
                <GtkLabel label="CPU Cores:" halign={Gtk.Align.START} />
              </GtkBox>
              <GtkBox orientation={Gtk.Orientation.HORIZONTAL} spacing={4}>
                {[1, 2, 4, 8].map((v) => (
                  <GtkButton
                    key={v}
                    label={v.toString()}
                    onClicked={() => setCores(v)}
                    cssClasses={
                      cores === v ? ["suggested-action", "pill"] : ["pill"]
                    }
                  />
                ))}
              </GtkBox>
            </GtkBox>
          </GtkBox>
        </GtkBox>

        {/* Run Button */}
        <IconButton
          iconName="media-playback-start-symbolic"
          label={isRunning ? "Running..." : "Run Virtual Machine"}
          onClick={handleRun}
          cssClasses={["suggested-action", "pill"]}
          sensitive={!isRunning && !!isoPath}
          halign={Gtk.Align.CENTER}
        />

        {/* Status Area */}
        <GtkBox
          orientation={Gtk.Orientation.VERTICAL}
          spacing={4}
          marginTop={20}
        >
          <GtkLabel
            label="Status:"
            cssClasses={["caption", "bold"]}
            halign={Gtk.Align.START}
          />
          <GtkLabel
            label={status}
            cssClasses={["caption", "dim-label"]}
            halign={Gtk.Align.START}
            wrap
          />
        </GtkBox>

        <GtkLabel
          label="github.com/carlosxfelipe/qemu-gui"
          cssClasses={["dim-label", "caption"]}
          marginTop={16}
          halign={Gtk.Align.CENTER}
        />
      </GtkBox>
    </GtkApplicationWindow>
  );
};

export default App;
