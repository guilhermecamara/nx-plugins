import executor from './executor';
import { ExecSyncOptionsWithBufferEncoding } from 'child_process'
import { ExecutorContext } from '@nrwl/devkit'

jest.mock('../../utils', () => ({
  runTfCommand: jest.fn(),
}))

import { runTfCommand } from '../../utils'

jest.mock('child_process', () => {
  const originalModule = jest.requireActual('child_process')
  return {
    __esModule: true,
    ...originalModule,
    execSync: jest.fn((command: string, options: ExecSyncOptionsWithBufferEncoding): Buffer => {
                expect(command).toMatch(/^terraform plan/)
                expect(options.cwd).toBe(process.cwd())
                return null
              }),
  }
})

const context: ExecutorContext = {
  projectName: 'my-app',
  root: '/root',
  cwd: '/root',
  isVerbose: false,
  workspace: {} as any,
  projectsConfigurations: {
    version: 2,
    projects: {
      'my-app': {
        root: 'apps/my-app',
        sourceRoot: 'apps/my-app',
        projectType: 'application',
        targets: {},
      },
    },
  },
} as ExecutorContext

describe('plan executor with workspace', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should select workspace then run plan', async () => {
    (runTfCommand as jest.Mock)
      .mockImplementationOnce(() => ({ success: true })) // workspace select
      .mockImplementationOnce(() => ({ success: true })) // plan

    const result = await executor({ workspace: 'dev' }, context)

    expect(runTfCommand).toHaveBeenCalledWith(context, 'workspace', ['select', 'dev'])
    expect(runTfCommand).toHaveBeenCalledWith(context, 'plan', expect.any(Array))
    expect(result.success).toBe(true)
  })

  it('should create workspace if select fails', async () => {
    (runTfCommand as jest.Mock)
      .mockImplementationOnce(() => ({ success: false })) // workspace select
      .mockImplementationOnce(() => ({ success: true }))  // workspace new
      .mockImplementationOnce(() => ({ success: true }))  // plan

    const result = await executor({ workspace: 'staging' }, context)

    expect(runTfCommand).toHaveBeenCalledWith(context, 'workspace', ['select', 'staging'])
    expect(runTfCommand).toHaveBeenCalledWith(context, 'workspace', ['new', 'staging'])
    expect(runTfCommand).toHaveBeenCalledWith(context, 'plan', expect.any(Array))
    expect(result.success).toBe(true)
  })

  it('should fail if both select and new fail', async () => {
    (runTfCommand as jest.Mock)
      .mockImplementationOnce(() => ({ success: false })) // workspace select
      .mockImplementationOnce(() => ({ success: false })) // workspace new

    const result = await executor({ workspace: 'fail-env' }, context)

    expect(result.success).toBe(false)
  })
})
