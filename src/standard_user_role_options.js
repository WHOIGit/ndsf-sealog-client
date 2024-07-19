import { _Cruise_, _cruises_, _lowerings_ } from './vocab'

export const standardUserRoleOptions = [
  { value: 'cruise_manager', label: `${_Cruise_} Manager`, description: `Ability to edit ${_cruises_} and ${_lowerings_}.` },
  { value: 'template_manager', label: 'Template Manager', description: 'Ability to edit event templates.' },
  { value: 'event_manager', label: 'Event Manager', description: `Ability to review events independent of ${_lowerings_}.` },
  { value: 'event_logger', label: 'Event Logger', description: 'Abiltiy to submit new events.' },
  { value: 'event_watcher', label: 'Event Watcher', description: 'Abilty to view events.' }
]

export const CRUISE_MANAGER = 'cruise_manager'
export const TEMPLATE_MANAGER = 'template_manager'
export const EVENT_MANAGER = 'event_manager'
export const EVENT_LOGGER = 'event_logger'
export const EVENT_WATCHER = 'event_watcher'
