// *********************************************************************
// Copyright (c) Microsoft Corporation.  All rights reserved.
// Licensed under the MIT License
// *********************************************************************
import Q from 'q';
import { getApiErrorMessage } from 'datax-common';
import * as Api from './api';
import * as KernelActions from './kernelActions';
import * as KernelSelectors from './kernelSelectors';

/**
 *
 * REDUX Action Types
 *
 */

// Init
export const QUERY_INIT = 'QUERY_INIT';
export const QUERY_NEW = 'QUERY_NEW';

// Query
export const QUERY_UPDATE_QUERY = 'QUERY_UPDATE_QUERY';


export const QUERY_UPDATE_RESAMPLING_INPUT_DURATION = 'QUERY_UPDATE_RESAMPLING_INPUT_DURATION';
export const QUERY_UPDATE_ERROR_MESSAGE = 'QUERY_UPDATE_ERROR_MESSAGE';
export const QUERY_UPDATE_WARNING_MESSAGE = 'QUERY_UPDATE_WARNING_MESSAGE';

export const updateSamplingInputDuration = duration => dispatch => {
    return dispatch({
        type: QUERY_UPDATE_SAMPLING_INPUT_DURATION,
        duration: duration
    });
};

// Query Actions
export const updateQuery = query => dispatch => {
    return dispatch({
        type: QUERY_UPDATE_QUERY,
        payload: query
    });
};

export const getTableSchemas = (flowname, displayName, query, inputSchemaFile, rules={}, outputTemplates) => {
    return Api.getTableSchemas(flowname, displayName, query, inputSchemaFile, rules, outputTemplates).then(tables => {
        let tableToSchemaMap = {};
        tables.forEach(table => {
            tableToSchemaMap[table.name] = table;
        });

        return tableToSchemaMap;
    });
};

export const getCodeGenQuery = (flowname, displayName, query, rules={}, outputTemplates) => {
    return Api.getCodeGenQuery(flowname, displayName, query, rules, outputTemplates).then(query => {
        return query;
    });
};

export const executeQuery = (flowname, displayName, selectedQuery, rules={}, outputTemplates, kernelId) => {
    return dispatch => {
        updateErrorMessage(dispatch, undefined);
        return Api.executeQuery(flowname, displayName, selectedQuery, rules, outputTemplates, kernelId)
            .then(result => {
                return result;
            })
            .catch(error => {
                const message = getApiErrorMessage(error);
                updateErrorMessage(dispatch, message);
                return Q.reject({ error: true, message: message });
            });
    };
};

export const resampleInput = (flowname, displayName, owner, inputSchemaFile, normalizationSnippet, inputEventhubConnection, inputSubscriptionId, inputResourceGroup, inputEventhubName, inputType, resamplingInputDuration, kernelId, version) => (dispatch, getState) => {
    updateErrorMessage(dispatch, undefined);
    KernelActions.fetchingKernel(dispatch, true);
    return Api.resampleInput(flowname, displayName, owner, inputSchemaFile, normalizationSnippet, inputEventhubConnection, inputSubscriptionId, inputResourceGroup, inputEventhubName, inputType, resamplingInputDuration, kernelId)
        .then(response => {
            const kernelId = response.result;
            const warning = response.message;

            const curVersion = KernelSelectors.getKernelVersion(getState());

            if (version >= curVersion) {
                return KernelActions.updateKernel(dispatch, kernelId, version, warning);
            } else {
                return Api.deleteDiagnosticKernel(kernelId);
            }
        })
        .catch(error => {
            const message = getApiErrorMessage(error);
            updateErrorMessage(dispatch, message);
            KernelActions.fetchingKernel(dispatch, false);
            return Q.reject({ error: true, message: message });
        });
};

export function updateErrorMessage(dispatch, message) {
    return dispatch({
        type: QUERY_UPDATE_ERROR_MESSAGE,
        message: message
    });
}

export const updateWarningMessage = message => dispatch => {
    return dispatch({
        type: QUERY_UPDATE_WARNING_MESSAGE,
        warning: message
    });
};