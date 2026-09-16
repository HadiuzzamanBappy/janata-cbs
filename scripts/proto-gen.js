const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const OUT_DIR = path.join("src", "lib", "core", "generated");
const PROTO_DIR = path.join("src", "grpc");

// Ensure output directory exists
fs.mkdirSync(OUT_DIR, { recursive: true });

const isWindows = process.platform === "win32";

const protocPlugin = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  isWindows ? "protoc-gen-ts_proto.cmd" : "protoc-gen-ts_proto"
);

if (!fs.existsSync(protocPlugin)) {
  console.error(`Error: ts-proto plugin not found at "${protocPlugin}". Please run 'pnpm install' first.`);
  process.exit(1);
}

const protoFile = path.join(PROTO_DIR, "service.proto");

console.log("Generating TypeScript stubs from proto files...");

try {
  execFileSync(
    "protoc",
    [
      `--plugin=protoc-gen-ts_proto=${protocPlugin}`,
      `--ts_proto_out=${OUT_DIR}`,
      "--ts_proto_opt=outputServices=grpc-js,esModuleInterop=true,useDate=false,env=node",
      "-I",
      PROTO_DIR,
      protoFile,
    ],
    {
      stdio: "inherit",
    }
  );
  console.log(`✓ Generated stubs in ${OUT_DIR}`);
} catch (error) {
  if (error.code === "ENOENT") {
    console.error("\nError: 'protoc' (protobuf compiler) command was not found in your system PATH.");
    console.error("Please install protoc:");
    console.error("  - Windows: choco install protoc / winget install Google.Protobuf / scoop install protoc");
    console.error("  - macOS: brew install protobuf");
    console.error("  - Linux: sudo apt install -y protobuf-compiler\n");
  } else {
    console.error("Error running protoc:", error.message);
  }
  process.exit(1);
}
