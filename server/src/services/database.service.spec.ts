import { DatabaseExtension, IDatabaseRepository, VectorIndex } from 'src/interfaces/database.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { DatabaseService } from 'src/services/database.service';
import { newDatabaseRepositoryMock } from 'test/repositories/database.repository.mock';
import { newLoggerRepositoryMock } from 'test/repositories/logger.repository.mock';
import { Mocked } from 'vitest';

describe(DatabaseService.name, () => {
  let sut: DatabaseService;
  let databaseMock: Mocked<IDatabaseRepository>;
  let loggerMock: Mocked<ILoggerRepository>;

  beforeEach(() => {
    delete process.env.DB_SKIP_MIGRATIONS;
    databaseMock = newDatabaseRepositoryMock();
    loggerMock = newLoggerRepositoryMock();
    sut = new DatabaseService(databaseMock, loggerMock);
  });

  it('should work', () => {
    expect(sut).toBeDefined();
  });

  it('should throw an error if PostgreSQL version is below minimum supported version', async () => {
    databaseMock.getPostgresVersion.mockResolvedValueOnce('13.10.0');

    await expect(sut.init()).rejects.toThrow('Invalid PostgreSQL version. Found 13.10.0');

    expect(databaseMock.getPostgresVersion).toHaveBeenCalledTimes(1);
  });

  it(`should start up successfully with pgvectors`, async () => {
    databaseMock.getPostgresVersion.mockResolvedValue('14.0.0');
    databaseMock.getExtensionVersion.mockResolvedValue('0.2.0');

    await expect(sut.init()).resolves.toBeUndefined();

    expect(databaseMock.getPostgresVersion).toHaveBeenCalled();
    expect(databaseMock.createExtension).toHaveBeenCalledWith(DatabaseExtension.VECTORS);
    expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
    expect(databaseMock.getExtensionVersion).toHaveBeenCalled();
    expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
    expect(loggerMock.fatal).not.toHaveBeenCalled();
  });

  it(`should start up successfully with pgvector`, async () => {
    process.env.DB_VECTOR_EXTENSION = 'pgvector';
    databaseMock.getPostgresVersion.mockResolvedValue('14.0.0');
    databaseMock.getExtensionVersion.mockResolvedValue('0.5.0');

    await expect(sut.init()).resolves.toBeUndefined();

    expect(databaseMock.createExtension).toHaveBeenCalledWith(DatabaseExtension.VECTOR);
    expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
    expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
    expect(loggerMock.fatal).not.toHaveBeenCalled();
  });

  // it(`should throw an error if ${extName} version is not installed even after createVectorExtension`, async () => {
  //   databaseMock.getExtensionVersion.mockResolvedValue(null);

  //   await expect(sut.init()).rejects.toThrow(`Unexpected: ${extName} extension is not installed.`);

  //   expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
  //   expect(databaseMock.runMigrations).not.toHaveBeenCalled();
  // });

  // it(`should throw an error if ${extName} version is below minimum supported version`, async () => {
  //   databaseMock.getExtensionVersion.mockResolvedValue(
  //     new Version(minVersion.major, minVersion.minor - 1, minVersion.patch),
  //   );

  //   await expect(sut.init()).rejects.toThrow(extName);

  //   expect(databaseMock.runMigrations).not.toHaveBeenCalled();
  // });

  // it.each([
  //   { type: VersionType.EQUAL, max: 'no', actual: 'patch' },
  //   { type: VersionType.PATCH, max: 'patch', actual: 'minor' },
  //   { type: VersionType.MINOR, max: 'minor', actual: 'major' },
  // ] as const)(
  //   `should throw an error if $max upgrade from min version is allowed and ${extName} version is $actual`,
  //   async ({ type, actual }) => {
  //     const version = new Version(minVersion.major, minVersion.minor, minVersion.patch);
  //     version[actual] = minVersion[actual] + 1;
  //     databaseMock.getExtensionVersion.mockResolvedValue(version);
  //     if (vectorExt === DatabaseExtension.VECTOR) {
  //       sut.minVectorVersion = minVersion;
  //       sut.vectorVersionPin = type;
  //     } else {
  //       sut.minVectorsVersion = minVersion;
  //       sut.vectorsVersionPin = type;
  //     }

  //     await expect(sut.init()).rejects.toThrow(extName);

  //     expect(databaseMock.runMigrations).not.toHaveBeenCalled();
  //   },
  // );

  // it(`should throw an error if ${extName} version is a nightly`, async () => {
  //   databaseMock.getExtensionVersion.mockResolvedValue(new Version(0, 0, 0));

  //   await expect(sut.init()).rejects.toThrow(extName);

  //   expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
  //   expect(databaseMock.runMigrations).not.toHaveBeenCalled();
  // });

  // it(`should throw error if ${extName} extension could not be created`, async () => {
  //   databaseMock.createExtension.mockRejectedValue(new Error('Failed to create extension'));

  //   await expect(sut.init()).rejects.toThrow('Failed to create extension');

  //   expect(loggerMock.fatal).toHaveBeenCalledTimes(1);
  //   expect(databaseMock.createExtension).toHaveBeenCalledTimes(1);
  //   expect(databaseMock.runMigrations).not.toHaveBeenCalled();
  // });

  // it(`should update ${extName} if a newer version is available`, async () => {
  //   const version = new Version(minVersion.major, minVersion.minor + 1, minVersion.patch);
  //   databaseMock.getAvailableExtensionVersion.mockResolvedValue(version);

  //   await expect(sut.init()).resolves.toBeUndefined();

  //   expect(databaseMock.updateVectorExtension).toHaveBeenCalledWith(vectorExt, version);
  //   expect(databaseMock.updateVectorExtension).toHaveBeenCalledTimes(1);
  //   expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
  //   expect(loggerMock.fatal).not.toHaveBeenCalled();
  // });

  // it(`should not update ${extName} if a newer version is higher than the maximum`, async () => {
  //   const version = new Version(minVersion.major + 1, minVersion.minor, minVersion.patch);
  //   databaseMock.getAvailableExtensionVersion.mockResolvedValue(version);

  //   await expect(sut.init()).resolves.toBeUndefined();

  //   expect(databaseMock.updateVectorExtension).not.toHaveBeenCalled();
  //   expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
  //   expect(loggerMock.fatal).not.toHaveBeenCalled();
  // });

  // it(`should warn if attempted to update ${extName} and failed`, async () => {
  //   const version = new Version(minVersion.major, minVersion.minor, minVersion.patch + 1);
  //   databaseMock.getAvailableExtensionVersion.mockResolvedValue(version);
  //   databaseMock.updateVectorExtension.mockRejectedValue(new Error('Failed to update extension'));

  //   await expect(sut.init()).resolves.toBeUndefined();

  //   expect(loggerMock.warn).toHaveBeenCalledTimes(1);
  //   expect(loggerMock.warn.mock.calls[0][0]).toContain(extName);
  //   expect(loggerMock.error).toHaveBeenCalledTimes(1);
  //   expect(loggerMock.fatal).not.toHaveBeenCalled();
  //   expect(databaseMock.updateVectorExtension).toHaveBeenCalledWith(vectorExt, version);
  //   expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
  // });

  // it(`should warn if ${extName} update requires restart`, async () => {
  //   const version = new Version(minVersion.major, minVersion.minor, minVersion.patch + 1);
  //   databaseMock.getAvailableExtensionVersion.mockResolvedValue(version);
  //   databaseMock.updateVectorExtension.mockResolvedValue({ restartRequired: true });

  //   await expect(sut.init()).resolves.toBeUndefined();

  //   expect(loggerMock.warn).toHaveBeenCalledTimes(1);
  //   expect(loggerMock.warn.mock.calls[0][0]).toContain(extName);
  //   expect(databaseMock.updateVectorExtension).toHaveBeenCalledWith(vectorExt, version);
  //   expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
  //   expect(loggerMock.fatal).not.toHaveBeenCalled();
  // });

  // it.each([{ index: VectorIndex.CLIP }, { index: VectorIndex.FACE }])(
  //   `should reindex $index if necessary`,
  //   async ({ index }) => {
  //     databaseMock.shouldReindex.mockImplementation((indexArg) => Promise.resolve(indexArg === index));

  //     await expect(sut.init()).resolves.toBeUndefined();

  //     expect(databaseMock.shouldReindex).toHaveBeenCalledWith(index);
  //     expect(databaseMock.shouldReindex).toHaveBeenCalledTimes(2);
  //     expect(databaseMock.reindex).toHaveBeenCalledWith(index);
  //     expect(databaseMock.reindex).toHaveBeenCalledTimes(1);
  //     expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
  //     expect(loggerMock.fatal).not.toHaveBeenCalled();
  //   },
  // );

  // it.each([{ index: VectorIndex.CLIP }, { index: VectorIndex.FACE }])(
  //   `should not reindex $index if not necessary`,
  //   async () => {
  //     databaseMock.shouldReindex.mockResolvedValue(false);

  //     await expect(sut.init()).resolves.toBeUndefined();

  //     expect(databaseMock.shouldReindex).toHaveBeenCalledTimes(2);
  //     expect(databaseMock.reindex).not.toHaveBeenCalled();
  //     expect(databaseMock.runMigrations).toHaveBeenCalledTimes(1);
  //     expect(loggerMock.fatal).not.toHaveBeenCalled();
  //   },
  // );

  // it('should skip migrations if DB_SKIP_MIGRATIONS=true', async () => {
  //   process.env.DB_SKIP_MIGRATIONS = 'true';

  //   await expect(sut.init()).resolves.toBeUndefined();

  //   expect(databaseMock.runMigrations).not.toHaveBeenCalled();
  // });
});
