import { spawn } from "child_process";
import { promises as fs } from "fs";
import * as Gtk from "@gtkx/ffi/gtk";

export interface QemuConfig {
  isoPath: string;
  ram: string;
  cores: number;
}

export async function checkKvmSupport(): Promise<boolean> {
  try {
    await fs.access("/dev/kvm");
    return true;
  } catch {
    return false;
  }
}

export async function pickIso(parentWindow: Gtk.Window): Promise<string | null> {
  try {
    const fileDialog = new Gtk.FileDialog();
    fileDialog.setTitle("Select ISO Image");
    
    const file = await fileDialog.openAsync(parentWindow);
    if (file) {
      return file.getPath();
    }
    return null;
  } catch (e) {
    console.error("Error picking file:", e);
    return null;
  }
}

export function runQemu(config: QemuConfig, useKvm: boolean) {
  const args = [
    useKvm ? "-enable-kvm" : "",
    useKvm ? "-cpu" : "",
    useKvm ? "host" : "",
    "-m", config.ram,
    "-smp", config.cores.toString(),
    "-cdrom", config.isoPath,
    "-vga", "virtio",
    "-display", "gtk,zoom-to-fit=on",
    "-usb",
    "-device", "usb-tablet",
    "-net", "nic,model=virtio",
    "-net", "user",
    "-boot", "d"
  ].filter(arg => arg !== "");

  console.log("Running QEMU with args:", args);
  
  const child = spawn("qemu-system-x86_64", args, {
    detached: true,
    stdio: "ignore"
  });

  child.unref();
  return child;
}
