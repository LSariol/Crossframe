import { marketAdapter } from "../adapters/market";
import { watchAdapter } from "../adapters/run";

watchAdapter(marketAdapter);
