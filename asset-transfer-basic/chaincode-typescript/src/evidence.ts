import { Object, Property } from "fabric-contract-api";

@Object()
export class Evidence {
  @Property()
  public ID: string;

  @Property()
  public caseId: string;

  @Property()
  public hash: string;
}
