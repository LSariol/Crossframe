import { wikiAdapter } from "../adapters/wiki";
import { watchAdapter } from "../adapters/run";

watchAdapter(wikiAdapter);
