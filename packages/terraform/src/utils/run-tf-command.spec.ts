import { runTfCommand } from './index'
import { execSync } from 'child_process'
import { ExecutorContext } from '@nrwl/devkit'

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}))

const mockExecSync = execSync as jest.Mock

const mockContext: ExecutorContext = {
  projectName: 'test-project',
  targetName: 'plan',
  configurationName: 'dev',
  workspace: {} as any,
  cwd: '/virtual',
  root: '/virtual',
  isVerbose: false,
  projectsConfigurations: {
    version: 2,
    projects: {
      'test-project': {
        root: 'apps/test-project',
        sourceRoot: 'apps/test-project',
        projectType: 'application',
        targets: {},
      },
    },
  },
} as ExecutorContext

describe('runTfCommand', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should run a successful terraform command', () => {
    mockExecSync.mockImplementation(() => {})
    const result = runTfCommand(mockContext, 'plan', ['-input=false'])
    expect(result.success).toBe(true)
    expect(mockExecSync).toHaveBeenCalledWith(
      'terraform plan -input=false',
      expect.objectContaining({ cwd: 'apps/test-project', stdio: [0, 1, 2] })
    )
  })

  it('should handle workspace commands correctly', () => {
    mockExecSync.mockImplementation(() => {})
    const result = runTfCommand(mockContext, 'workspace', ['select', 'dev'])
    expect(result.success).toBe(true)
    expect(mockExecSync).toHaveBeenCalledWith(
      'terraform workspace select dev',
      expect.objectContaining({ cwd: 'apps/test-project', stdio: [0, 1, 2] })
    )
  })

  it('should return false on execSync error', () => {
    mockExecSync.mockImplementation(() => {
      throw new Error('Execution failed')
    })
    const result = runTfCommand(mockContext, 'plan', ['-input=false'])
    expect(result.success).toBe(false)
  })
})
