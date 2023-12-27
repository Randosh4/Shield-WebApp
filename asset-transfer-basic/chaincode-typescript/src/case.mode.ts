import { Object, Property } from "fabric-contract-api";
import { Evidence } from "./evidence";

@Object()
export class Case {
  @Property()
  public ID: string;

  @Property()
  public hash?: string;
}
