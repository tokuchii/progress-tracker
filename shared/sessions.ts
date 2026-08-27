export interface BootcampSession {
  id: string
  number: number
  title: string
  xp?: number
}

export interface BootcampSection {
  id: string
  name: string
  duration: string
  sessions: BootcampSession[]
}

export interface Member {
  name: string
  email: string
}

export interface AssignedMember extends Member {
  completed: boolean
}

export interface MemberStat extends Member {
  done: number
  total: number
}

export const bootcampSections: BootcampSection[] = [
  {
    id: 'functional',
    name: 'Functional',
    duration: '22h 30m',
    sessions: [
      { id: 's1', number: 1, title: 'Quiz: CRM, Sales, Invoicing', xp: 300 },
      { id: 's2', number: 2, title: 'Use case: CityBike' },
      { id: 's3', number: 3, title: 'Quiz: Project & Timesheet', xp: 300 },
      { id: 's4', number: 4, title: 'Use case: CityBike' },
      { id: 's5', number: 5, title: 'Quiz: Purchase, Inventory & Manufacturing', xp: 300 },
      { id: 's6', number: 6, title: 'Use case: CityBike' },
      { id: 's7', number: 7, title: 'Quiz: Accounting', xp: 300 },
      { id: 's8', number: 8, title: 'Use case: CityBike' }
    ]
  },
  {
    id: 'methodology',
    name: 'Methodology',
    duration: '8h 30m',
    sessions: [
      { id: 's9', number: 9, title: 'Project Life Cycle & Introduction to OIM' },
      { id: 's10', number: 10, title: 'Kick Off: Project Alignment & Business Analysis' },
      { id: 's11', number: 11, title: 'Droneland: Kick Off' },
      { id: 's12', number: 12, title: 'Project Roadmap' },
      { id: 's13', number: 13, title: 'Droneland: Roadmap' },
      { id: 's14', number: 14, title: 'Droneland: MVP1' },
      { id: 's15', number: 15, title: 'Droneland: Challenge the Customer & Progress Report' }
    ]
  },
  {
    id: 'technico',
    name: 'Technico-functional',
    duration: '1d 1h',
    sessions: [
      { id: 's16', number: 16, title: 'Basic Technico-functional Knowledge (Odoo Studio)' },
      { id: 's17', number: 17, title: 'Create an App from Scratch' },
      { id: 's18', number: 18, title: 'Odoo Transversal Knowledge' },
      { id: 's19', number: 19, title: 'Development & Odoo SH' },
      { id: 's20', number: 20, title: 'Writing Specifications' },
      { id: 's21', number: 21, title: 'Basic Data Import' },
      { id: 's22', number: 22, title: 'Advanced Data Import' },
      { id: 's23', number: 23, title: 'Reporting, Spreadsheet & Dashboard' },
      { id: 's24', number: 24, title: 'Reporting, Spreadsheet & Dashboard: Use Cases' },
      { id: 's25', number: 25, title: 'The Presales Process & the (R)OI' }
    ]
  },
  {
    id: 'further',
    name: 'Going Further',
    duration: '3h 30m',
    sessions: [
      { id: 's26', number: 26, title: 'Mind Maps, PKB, Documentation & Forum' },
      { id: 's27', number: 27, title: 'Use case 4: POS' }
    ]
  }
]

export const allSessions = bootcampSections.flatMap(section => section.sessions)

export const totalXp = allSessions.reduce((sum, session) => sum + (session.xp ?? 0), 0)

export function findSession(id: string) {
  return allSessions.find(session => session.id === id)
}
