function nowIso() {
  return new Date().toISOString();
}

function formatMeta(meta) {
  if (!meta) {
    return "";
  }

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " [unserializable-meta]";
  }
}

function info(event, meta) {
  console.log(`[${nowIso()}] [INFO] [${event}]${formatMeta(meta)}`);
}

function warn(event, meta) {
  console.warn(`[${nowIso()}] [WARN] [${event}]${formatMeta(meta)}`);
}

function error(event, meta) {
  console.error(`[${nowIso()}] [ERROR] [${event}]${formatMeta(meta)}`);
}

module.exports = {
  info,
  warn,
  error,
};