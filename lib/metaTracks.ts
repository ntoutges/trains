import { Segment, Vector } from "./maths.js";
import { Track, BridgeTrack } from "./tracks.js";

// contains no switches
export class TrackNetwork {
  private t: Track[];
  constructor(vectors: Vector[]) { // Array<Vector>
    this.t = [];
    for (let i = 0; i < vectors.length-1; i++) {
      this.t.push(
        new Track({
          segment: new Segment({
            vector: vectors[i],
            offVector: vectors[i+1].add(vectors[i].scale(-1))
          }),
          inTrack: (i == 0) ? null : this.t[i-1] // track leading into this track is previous track
        })
      )
      if (i != 0) this.t[i-1].outTrack = this.t[i]; // last track leads into this track
    };
  }

  get tracks() { return this.t; }
  get firstTrack() { return this.t[0]; }
  get lastTrack() { return this.t[this.t.length-1]; }
}

interface TrackSystemInterface {
  networks: Record<string, TrackNetwork>
  switches: Record<string, string[]> // connects one network to others (out) of [key] record connects to (in) of [value] record
};

// uses switches to bridge between multiple TrackNetwork instances
export class TrackSystem {
  private b: BridgeTrack[];
  private n: TrackNetwork[];
  private m: Record<string, number>; // bridge map: convert network id to bridge index in [this.b]
  constructor({
    networks,
    switches
  }: TrackSystemInterface) {
    // const bridges: BridgeTrack[] = [];
    const bridgeInformation: Array<[Array<string>, Record<string,boolean>]> = [];
    const discoveredNetworks: Record<string,boolean> = {};

    for (let networkId in switches) {
      if (!(networkId in networks)) throw new Error(`Invalid connecting network id: ${networkId}`);
      
      let discovered: string[] = []; // (network to connect) that have already been seen
      let notDiscovered: string[] = []; // any (network to connect) that have not been discovered
      for (let connectedNetworkId of switches[networkId]) {
        if (!(connectedNetworkId in networks)) throw new Error(`Invalid connected network id: ${connectedNetworkId}`)
      
        if (connectedNetworkId in discoveredNetworks) { discovered.push(connectedNetworkId); }
        else {
          notDiscovered.push(connectedNetworkId);
          discoveredNetworks[connectedNetworkId] = true; // save as discovered
        }
      }

      if (discovered.length > 0) {
        // find/combine all networks that contain matching out nodes
        let matchingNetworks: number[] = [];
        let matchingNetworkIds: string[] = [];
        let networkMap: Record<string,boolean> = {};
        for (let i in bridgeInformation) {
          const bridgeInfo = bridgeInformation[i];
          for (let toMatch of discovered) {
            if (toMatch in bridgeInfo[1]) {
              for (let networkId in bridgeInfo[1]) { networkMap[networkId] = true; }
              matchingNetworks.push(+i);
              matchingNetworkIds = matchingNetworkIds.concat(bridgeInfo[0]);
              break;
            }
          }
        }
        matchingNetworkIds.push(networkId); // add in current networkId, in addition to original networkIds
        // add in undiscovered networks
        for (let networkId of notDiscovered) { networkMap[networkId] = true; }
        // remove duplicate networks
        for (let i = matchingNetworks.length-1; i >= 0; i--) { // remove from end of list, to avoid indecies shifting
          bridgeInformation.splice(matchingNetworks[i], 1);
        }
        // create new composite network
        bridgeInformation.push([
          matchingNetworkIds,
          networkMap
        ]);
      }
      else {
        const networkMap: Record<string,boolean> = {};
        for (let connectedNetworkId of switches[networkId]) { networkMap[connectedNetworkId] = true; }
        bridgeInformation.push([
          [networkId],
          networkMap
        ]);
      }
    }

    this.b = [];
    this.m = {};
    for (let bridgeInfo of bridgeInformation) {
      const inTracks: Track[] = [];
      const outTracks: Track[] = [];

      for (let networkId of bridgeInfo[0]) {
        inTracks.push(networks[networkId].lastTrack);
        this.m[networkId] = this.b.length;
      }
      for (let networkId in bridgeInfo[1]) { outTracks.push(networks[networkId].firstTrack); }

      this.b.push(
        new BridgeTrack({
          inTracks,
          outTracks
        })
      );
    }

    // convert [networks] to an array
    this.n = [];
    for (let networkId in networks) { this.n.push(networks[networkId]); }
  }

  get tracks() {
    let tracks: Track[] = [];
    for (const network of this.n) { tracks = tracks.concat(network.tracks); }
    for (const bridge of this.b) { tracks.push(bridge); }
    return tracks;
  }

  getBridgeFrom(networkId: string): BridgeTrack {
    return (networkId in this.m) ? this.b[this.m[networkId]] : null;
  }
}