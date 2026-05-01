import * as Gtk from "@gtkx/ffi/gtk";
import * as Pango from "@gtkx/ffi/pango";
import { 
  GtkApplicationWindow, 
  GtkBox, 
  GtkButton, 
  GtkLabel, 
  quit 
} from "@gtkx/react";
import { useState, useEffect, useRef } from "react";
import { checkKvmSupport, pickIso, runQemu, QemuConfig } from "./systemInterop.js";

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
      cores
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
        <GtkBox orientation={Gtk.Orientation.VERTICAL} spacing={4} marginBottom={16}>
          <GtkLabel label="QEMU Launcher" cssClasses={["title-1"]} halign={Gtk.Align.START} />
          <GtkLabel 
            label="Configure and run your virtual machine" 
            cssClasses={["dim-label", "body"]} 
            halign={Gtk.Align.START} 
          />
        </GtkBox>

        {/* ISO Selection Card */}
        <GtkBox orientation={Gtk.Orientation.VERTICAL} spacing={10} cssClasses={["card"]}>
          <GtkLabel label="ISO Image" cssClasses={["bold", "body"]} halign={Gtk.Align.START} />
          <GtkBox orientation={Gtk.Orientation.HORIZONTAL} spacing={10}>
            <GtkLabel 
              label={isoPath || "No ISO selected"} 
              hexpand 
              halign={Gtk.Align.START}
              cssClasses={["iso-path-label", "caption"]}
              ellipsize={Pango.EllipsizeMode.END}
            />
            <GtkButton 
              label="Browse..." 
              onClicked={handlePickIso}
              cssClasses={["pill"]}
            />
          </GtkBox>
        </GtkBox>

        {/* Configuration Card */}
        <GtkBox orientation={Gtk.Orientation.VERTICAL} spacing={16} cssClasses={["card"]} marginTop={10}>
          <GtkLabel label="System Configuration" cssClasses={["bold", "body"]} halign={Gtk.Align.START} />
          
          {/* RAM Selection */}
          <GtkBox orientation={Gtk.Orientation.HORIZONTAL} spacing={10}>
            <GtkLabel label="Memory (RAM):" hexpand halign={Gtk.Align.START} />
            <GtkBox orientation={Gtk.Orientation.HORIZONTAL} spacing={4}>
              {["2G", "4G", "8G", "16G"].map(v => (
                <GtkButton 
                  key={v}
                  label={v} 
                  onClicked={() => setRam(v)}
                  cssClasses={ram === v ? ["suggested-action", "pill"] : ["pill"]}
                />
              ))}
            </GtkBox>
          </GtkBox>

          {/* Cores Selection */}
          <GtkBox orientation={Gtk.Orientation.HORIZONTAL} spacing={10}>
            <GtkLabel label="CPU Cores:" hexpand halign={Gtk.Align.START} />
            <GtkBox orientation={Gtk.Orientation.HORIZONTAL} spacing={4}>
              {[1, 2, 4, 8].map(v => (
                <GtkButton 
                  key={v}
                  label={v.toString()} 
                  onClicked={() => setCores(v)}
                  cssClasses={cores === v ? ["suggested-action", "pill"] : ["pill"]}
                />
              ))}
            </GtkBox>
          </GtkBox>
        </GtkBox>

        {/* Run Button */}
        <GtkButton 
          label={isRunning ? "Running..." : "Run Virtual Machine"} 
          onClicked={handleRun}
          marginTop={20}
          cssClasses={["suggested-action", "pill"]}
          sensitive={!isRunning && !!isoPath}
          halign={Gtk.Align.CENTER}
        />

        {/* Status Area */}
        <GtkBox orientation={Gtk.Orientation.VERTICAL} spacing={4} marginTop={20}>
          <GtkLabel label="Status:" cssClasses={["caption", "bold"]} halign={Gtk.Align.START} />
          <GtkLabel 
            label={status} 
            cssClasses={["caption", "dim-label"]} 
            halign={Gtk.Align.START}
            wrap
          />
        </GtkBox>
      </GtkBox>
    </GtkApplicationWindow>
  );
};

export default App;
