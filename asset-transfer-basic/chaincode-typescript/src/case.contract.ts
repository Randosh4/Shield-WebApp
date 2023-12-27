/* * SPDX-License-Identifier: Apache-2.0 */
import {
  Context,
  Contract,
  Info,
  Returns,
  Transaction,
} from "fabric-contract-api";
import stringify from "json-stringify-deterministic";
import sortKeysRecursive from "sort-keys-recursive";
import { Case } from "./case.mode";
import { Evidence } from "./evidence";

@Info({
  title: "CaseContract",
  description: "Smart contract for storing and retrieving cases",
})
export class CaseContract extends Contract {
  @Transaction()
  public async CreateCase(
    ctx: Context,
    id: string,
    hash: string
  ): Promise<void> {
    const exists = await this.RecordExists(ctx, id);
    if (exists) {
      throw new Error(`The case ${id} already exists`);
    }
    const caseObj: Case = { ID: id, hash };
    await ctx.stub.putState(
      `case_${id}`,
      Buffer.from(stringify(sortKeysRecursive(caseObj)))
    );
  }

  @Transaction()
  public async CreateEvidence(
    ctx: Context,
    caseId: string,
    id: string,
    hash: string
  ): Promise<void> {
    const exists = await this.RecordExists(ctx, `evidence_${caseId}_${id}`);

    if (exists) {
      throw new Error(`The evidence ${id} already exists`);
    }
    const caseObj: Evidence = { ID: id, hash, caseId };
    await ctx.stub.putState(
      `evidence_${caseId}_${id}`,
      Buffer.from(stringify(sortKeysRecursive(caseObj)))
    );
  }

  @Transaction(false)
  @Returns("string")
  public async ReadCase(ctx: Context, id: string): Promise<string> {
    const caseJSON = await ctx.stub.getState(`case_${id}`);
    if (!caseJSON || caseJSON.length === 0) {
      throw new Error(`The case ${id} does not exist`);
    }

    return JSON.stringify({
      ...caseJSON,
    });
  }

  @Transaction(false)
  @Returns("string")
  public async readEvidence(
    ctx: Context,
    caseId: string,
    id: string
  ): Promise<string> {
    const caseJSON = await ctx.stub.getState(`evidence_${caseId}_${id}`);
    if (!caseJSON || caseJSON.length === 0) {
      throw new Error(`The evidence ${id} does not exist`);
    }
    return caseJSON.toString();
  }

  @Transaction()
  public async UpdateCase(
    ctx: Context,
    id: string,
    hash: string
  ): Promise<void> {
    const exists = await this.RecordExists(ctx, `case_${id}`);
    if (!exists) {
      throw new Error(`The case ${id} does not exist`);
    }
    const caseObj: Case = { ID: id, hash };
    await ctx.stub.putState(
      `case_${id}`,
      Buffer.from(stringify(sortKeysRecursive(caseObj)))
    );
  }

  @Transaction()
  public async UpdateEvidence(
    ctx: Context,
    caseId: string,
    id: string,
    hash: string
  ): Promise<void> {
    const exists = await this.RecordExists(ctx, `evidence_${caseId}_${id}`);
    if (!exists) {
      throw new Error(`The evidence ${id} does not exist`);
    }
    const caseObj: Evidence = { ID: id, hash, caseId };
    await ctx.stub.putState(
      `evidence_${caseId}_${id}`,
      Buffer.from(stringify(sortKeysRecursive(caseObj)))
    );
  }

  @Transaction()
  public async DeleteCase(ctx: Context, id: string): Promise<void> {
    const exists = await this.RecordExists(ctx, `case_${id}`);
    if (!exists) {
      throw new Error(`The case ${id} does not exist`);
    }
    await ctx.stub.deleteState(`case_${id}`);
  }

  @Transaction()
  public async DeleteEvidence(
    ctx: Context,
    caseId: string,
    id: string
  ): Promise<void> {
    const exists = await this.RecordExists(ctx, `evidence_${caseId}_${id}`);
    if (!exists) {
      throw new Error(`The case ${id} does not exist`);
    }
    await ctx.stub.deleteState(`evidence_${caseId}_${id}`);
  }

  @Transaction(false)
  @Returns("boolean")
  public async RecordExists(ctx: Context, id: string): Promise<boolean> {
    const caseJSON = await ctx.stub.getState(id);
    return caseJSON && caseJSON.length > 0;
  }

  @Transaction(false)
  @Returns("string")
  public async GetCaseWithHashes(
    ctx: Context,
    caseId: string
  ): Promise<string> {
    const caseKey = `case_${caseId}`;
    const caseBytes = await ctx.stub.getState(caseKey);

    if (!caseBytes || caseBytes.length === 0) {
      throw new Error(`The case ${caseId} does not exist`);
    }
    const caseData = JSON.parse(caseBytes.toString());

    const iterator = await ctx.stub.getHistoryForKey(caseKey);
    let results = [];
    while (true) {
      let res = await iterator.next();
      if (res.value && res.value.value.toString()) {
        let jsonRes = {};
        jsonRes["TxId"] = res.value.txId;
        jsonRes["Timestamp"] = res.value.timestamp;
        jsonRes["IsDelete"] = res.value.isDelete.toString();
        jsonRes["Value"] = res.value.value.toString()
          ? JSON.parse(res.value.value.toString())
          : null;
        results.push(jsonRes);
      }
      if (res.done) {
        await iterator.close();
        return JSON.stringify(results);
      }
    }
  }

  @Transaction(false)
  @Returns("string")
  public async GetAllCases(ctx: Context): Promise<string> {
    const allResults = await this.getAllRecords(ctx, "case_", "case_\uffff");
    return JSON.stringify(allResults);
  }

  @Transaction(false)
  @Returns("string")
  public async GetAllEvidence(ctx: Context, caseId: string): Promise<string> {
    const allResults = await this.getAllRecords(
      ctx,
      `evidence_${caseId}`,
      `evidence_${caseId}_\uffff`
    );
    return JSON.stringify(allResults);
  }

  private async getAllRecords(
    ctx: Context,
    startKey: string,
    endKey: string
  ): Promise<any[]> {
    const allResults = [];
    const iterator = await ctx.stub.getStateByRange(startKey, endKey);
    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString(
        "utf8"
      );
      let record;
      try {
        record = JSON.parse(strValue);
      } catch (err) {
        console.log(err);
        record = strValue;
      }
      allResults.push(record);
      result = await iterator.next();
    }
    return allResults;
  }
}
