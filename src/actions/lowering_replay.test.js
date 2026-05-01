import axios from 'axios';
import {
  eventUpdateLoweringReplay,
  initLoweringReplay
} from './index';
import {
  EVENT_FETCHING,
  INIT_CRUISE,
  INIT_EVENT,
  INIT_LOWERING,
  SET_SELECTED_EVENT,
  SHOW_ASNAP,
  UPDATE_EVENTS
} from './types';

jest.mock('axios');
jest.mock('client_config', () => ({
  API_ROOT_URL: 'http://api.test/sealog-server'
}));
jest.mock('universal-cookie', () => jest.fn().mockImplementation(() => ({
  get: () => 'test-token'
})));

const lowering = {
  id: 'lowering-db-id',
  lowering_id: 'Alvin-D2770',
  start_ts: '2000-01-01T00:00:00.000Z',
  stop_ts: '2000-01-01T01:00:00.000Z'
};

const cruise = {
  id: 'cruise-db-id',
  cruise_id: 'AT-test'
};

const asnapEvent = {
  id: 'asnap-event-id',
  event_value: 'ASNAP',
  ts: '2000-01-01T00:15:00.000Z'
};

const selectedASNAPEvent = {
  ...asnapEvent,
  aux_data: []
};

function createThunkHarness(initialState = {}) {
  let state = {
    event: {
      eventFilter: {}
    },
    lowering: {
      lowering: null
    },
    ...initialState
  };
  const actions = [];

  const getState = () => state;
  const dispatch = jest.fn((action) => {
    if(typeof action === 'function') {
      return action(dispatch, getState);
    }

    actions.push(action);

    if(action.type === INIT_LOWERING) {
      state = {
        ...state,
        lowering: {
          ...state.lowering,
          lowering: action.payload
        }
      };
    }

    return action;
  });

  return { actions, dispatch, getState };
}

function urlForCall(callIndex) {
  return new URL(axios.get.mock.calls[callIndex][0]);
}

describe('lowering replay actions', () => {
  beforeEach(() => {
    axios.get.mockReset();
  });

  it('auto-shows ASNAP on initial replay load when hidden-ASNAP results are empty but ASNAP events exist', async () => {
    axios.get
      .mockResolvedValueOnce({ data: lowering })
      .mockResolvedValueOnce({ data: [cruise] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [asnapEvent] })
      .mockResolvedValueOnce({ data: selectedASNAPEvent });

    const { actions, dispatch, getState } = createThunkHarness();

    await initLoweringReplay('Alvin-D2770', true)(dispatch, getState);
    await Promise.resolve();

    expect(urlForCall(2).pathname).toBe('/sealog-server/api/v1/events/bylowering/lowering-db-id');
    expect(urlForCall(2).searchParams.getAll('value')).toEqual(['!ASNAP']);
    expect(urlForCall(3).pathname).toBe('/sealog-server/api/v1/events/bylowering/lowering-db-id');
    expect(urlForCall(3).searchParams.getAll('value')).toEqual([]);
    expect(actions).toContainEqual({ type: SHOW_ASNAP });
    expect(actions).toContainEqual({ type: INIT_EVENT, payload: [asnapEvent] });
    expect(actions).toContainEqual({ type: SET_SELECTED_EVENT, payload: selectedASNAPEvent });
  });

  it('auto-shows ASNAP on replay filter updates while preserving user filters on the fallback request', async () => {
    axios.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [asnapEvent] })
      .mockResolvedValueOnce({ data: selectedASNAPEvent });

    const { actions, dispatch, getState } = createThunkHarness({
      event: {
        eventFilter: {
          startTS: '2000-01-01T00:00:00.000Z',
          stopTS: '2000-01-01T01:00:00.000Z',
          value: 'BIOLOGY,SAMPLE',
          author: 'alvin,bob',
          freetext: 'vent',
          fulltext: 'white smoker',
          datasource: 'vehicleRealtimeNavData'
        }
      }
    });

    await eventUpdateLoweringReplay('lowering-db-id', true)(dispatch, getState);
    await Promise.resolve();

    expect(urlForCall(0).searchParams.getAll('value')).toEqual(['!ASNAP', 'BIOLOGY', 'SAMPLE']);
    expect(urlForCall(1).searchParams.getAll('value')).toEqual(['BIOLOGY', 'SAMPLE']);
    expect(urlForCall(1).searchParams.getAll('author')).toEqual(['alvin', 'bob']);
    expect(urlForCall(1).searchParams.get('freetext')).toBe('vent');
    expect(urlForCall(1).searchParams.get('fulltext')).toBe('white smoker');
    expect(urlForCall(1).searchParams.get('datasource')).toBe('vehicleRealtimeNavData');
    expect(actions).toContainEqual({ type: SHOW_ASNAP });
    expect(actions).toContainEqual({ type: UPDATE_EVENTS, payload: [asnapEvent] });
    expect(actions).toContainEqual({ type: EVENT_FETCHING, payload: false });
  });

  it('does not auto-show ASNAP when replay updates opt out of fallback', async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    const { actions, dispatch, getState } = createThunkHarness();

    await eventUpdateLoweringReplay('lowering-db-id', true, false)(dispatch, getState);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(urlForCall(0).searchParams.getAll('value')).toEqual(['!ASNAP']);
    expect(actions).not.toContainEqual({ type: SHOW_ASNAP });
    expect(actions).toContainEqual({ type: UPDATE_EVENTS, payload: [] });
  });
});
