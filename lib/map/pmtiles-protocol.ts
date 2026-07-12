import { addProtocol } from "maplibre-gl";
import { PMTiles, Protocol } from "pmtiles";

const pmtilesProtocolName = "pmtiles";
const protocolStateKey = Symbol.for("cunge-di.pmtiles.protocol-state");

type PmtilesProtocolState = {
  archives: Set<string>;
  protocol: Protocol;
  registered: boolean;
};

function getPmtilesProtocolState(): PmtilesProtocolState {
  const globalState = globalThis as typeof globalThis & {
    [protocolStateKey]?: PmtilesProtocolState;
  };

  if (!globalState[protocolStateKey]) {
    globalState[protocolStateKey] = {
      archives: new Set<string>(),
      protocol: new Protocol(),
      registered: false,
    };
  }

  return globalState[protocolStateKey];
}

export function registerPmtilesArchive(sourceUrl: string) {
  const state = getPmtilesProtocolState();

  if (!state.registered) {
    addProtocol(pmtilesProtocolName, state.protocol.tile);
    state.registered = true;
  }

  if (!state.archives.has(sourceUrl)) {
    state.protocol.add(new PMTiles(sourceUrl.replace(/^pmtiles:\/\//, "")));
    state.archives.add(sourceUrl);
  }
}
