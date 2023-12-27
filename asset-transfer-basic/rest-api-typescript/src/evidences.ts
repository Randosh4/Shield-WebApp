/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * This sample is intended to work with the basic asset transfer
 * chaincode which imposes some constraints on what is possible here.
 *
 * For example,
 *  - There is no validation for Asset IDs
 *  - There are no error codes from the chaincode
 *
 * To avoid timeouts, long running tasks should be decoupled from HTTP request
 * processing
 *
 * Submit transactions can potentially be very long running, especially if the
 * transaction fails and needs to be retried one or more times
 *
 * To allow requests to respond quickly enough, this sample queues submit
 * requests for processing asynchronously and immediately returns 202 Accepted
 */

import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { Contract } from 'fabric-network';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { Queue } from 'bullmq';
import { AssetNotFoundError } from './errors';
import { evatuateTransaction } from './fabric';
import { addSubmitTransactionJob } from './jobs';
import { logger } from './logger';

const { ACCEPTED, BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND, OK } =
  StatusCodes;

export const evidencesRouter = express.Router();

evidencesRouter.get('/:caseId', async (req: Request, res: Response) => {
  const caseId = req.params.caseId;

  try {
    const mspId = req.user as string;
    const contract = req.app.locals[mspId]?.assetContract as Contract;

    const data = await evatuateTransaction(contract, 'GetAllEvidence', caseId);
    let cases = [];
    if (data.length > 0) {
      cases = JSON.parse(data.toString());
    }

    return res.status(OK).json(cases);
  } catch (err) {
    logger.error({ err }, 'Error processing get all cases request');
    return res.status(INTERNAL_SERVER_ERROR).json({
      status: getReasonPhrase(INTERNAL_SERVER_ERROR),
      timestamp: new Date().toISOString(),
    });
  }
});

evidencesRouter.post(
  '/',
  body().isObject().withMessage('body must contain an case object'),
  body('Hash', 'must be a string').notEmpty(),
  body('caseId', 'must be a string').notEmpty(),
  body('ID', 'must be a string').notEmpty(),

  async (req: Request, res: Response) => {
    logger.debug(req.body, 'Create case request received');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(BAD_REQUEST).json({
        status: getReasonPhrase(BAD_REQUEST),
        reason: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        timestamp: new Date().toISOString(),
        errors: errors.array(),
      });
    }

    const mspId = req.user as string;
    const caseId = req.body.caseId;

    try {
      const submitQueue = req.app.locals.jobq as Queue;
      const jobId = await addSubmitTransactionJob(
        submitQueue,
        mspId,
        'CreateEvidence',
        caseId,
        req.body.ID,
        req.body.Hash
      );

      return res.status(ACCEPTED).json({
        status: getReasonPhrase(ACCEPTED),
        jobId: jobId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error(
        { err },
        'Error processing create case request for case ID %s',
        caseId
      );

      return res.status(INTERNAL_SERVER_ERROR).json({
        status: getReasonPhrase(INTERNAL_SERVER_ERROR),
        timestamp: new Date().toISOString(),
      });
    }
  }
);

evidencesRouter.options('/:caseId', async (req: Request, res: Response) => {
  const caseId = req.params.caseId;
  logger.debug('Case options request received for asset ID %s', caseId);

  try {
    const mspId = req.user as string;
    const contract = req.app.locals[mspId]?.assetContract as Contract;

    const data = await evatuateTransaction(contract, 'CaseExists', caseId);
    const exists = data.toString() === 'true';

    if (exists) {
      return res
        .status(OK)
        .set({
          Allow: 'DELETE,GET,OPTIONS,PATCH,PUT',
        })
        .json({
          status: getReasonPhrase(OK),
          timestamp: new Date().toISOString(),
        });
    } else {
      return res.status(NOT_FOUND).json({
        status: getReasonPhrase(NOT_FOUND),
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    logger.error(
      { err },
      'Error processing case options request for asset ID %s',
      caseId
    );
    return res.status(INTERNAL_SERVER_ERROR).json({
      status: getReasonPhrase(INTERNAL_SERVER_ERROR),
      timestamp: new Date().toISOString(),
    });
  }
});

evidencesRouter.get('/:caseId/:id', async (req: Request, res: Response) => {
  const caseId = req.params.caseId;
  const id = req.params.id;

  logger.debug('Read case request received for case ID %s %s', caseId, id);

  try {
    const mspId = req.user as string;
    const contract = req.app.locals[mspId]?.assetContract as Contract;

    const data = await evatuateTransaction(
      contract,
      'readEvidence',
      caseId,
      id
    );
    const asset = JSON.parse(data.toString());

    return res.status(OK).json(asset);
  } catch (err) {
    logger.error(
      { err },
      'Error processing read evidence request for case ID %s',
      caseId
    );

    if (err instanceof AssetNotFoundError) {
      return res.status(NOT_FOUND).json({
        status: getReasonPhrase(NOT_FOUND),
        timestamp: new Date().toISOString(),
      });
    }

    return res.status(INTERNAL_SERVER_ERROR).json({
      status: getReasonPhrase(INTERNAL_SERVER_ERROR),
      timestamp: new Date().toISOString(),
    });
  }
});

evidencesRouter.put(
  '/:caseId/:id',
  body().isObject().withMessage('body must contain an case object'),
  body('ID', 'must be a string').notEmpty(),
  body('caseId', 'must be a string').notEmpty(),
  body('Hash', 'must be a string').notEmpty(),

  async (req: Request, res: Response) => {
    logger.debug(req.body, 'Update case request received');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(BAD_REQUEST).json({
        status: getReasonPhrase(BAD_REQUEST),
        reason: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        timestamp: new Date().toISOString(),
        errors: errors.array(),
      });
    }

    if (req.params.caseId != req.body.caseId || req.params.id != req.body.ID) {
      return res.status(BAD_REQUEST).json({
        status: getReasonPhrase(BAD_REQUEST),
        reason: 'CASE_ID_MISMATCH',
        message: 'Case IDs must match',
        timestamp: new Date().toISOString(),
      });
    }

    const mspId = req.user as string;

    try {
      const submitQueue = req.app.locals.jobq as Queue;
      const jobId = await addSubmitTransactionJob(
        submitQueue,
        mspId,
        'UpdateEvidence',
        req.body.caseId,
        req.body.ID,
        req.body.Hash
      );

      return res.status(ACCEPTED).json({
        status: getReasonPhrase(ACCEPTED),
        jobId: jobId,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error(
        { err },
        'Error processing update asset request for asset ID %s',
        req.body.caseId
      );

      return res.status(INTERNAL_SERVER_ERROR).json({
        status: getReasonPhrase(INTERNAL_SERVER_ERROR),
        timestamp: new Date().toISOString(),
      });
    }
  }
);

evidencesRouter.delete('/:caseId/:id', async (req: Request, res: Response) => {
  logger.debug(req.body, 'Delete case request received');

  const mspId = req.user as string;
  const caseId = req.params.caseId;
  const id = req.params.id;

  try {
    const submitQueue = req.app.locals.jobq as Queue;
    const jobId = await addSubmitTransactionJob(
      submitQueue,
      mspId,
      'DeleteEvidence',
      caseId,
      id
    );

    return res.status(ACCEPTED).json({
      status: getReasonPhrase(ACCEPTED),
      jobId: jobId,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error(
      { err },
      'Error processing delete case request for case ID %s',
      caseId
    );

    return res.status(INTERNAL_SERVER_ERROR).json({
      status: getReasonPhrase(INTERNAL_SERVER_ERROR),
      timestamp: new Date().toISOString(),
    });
  }
});
