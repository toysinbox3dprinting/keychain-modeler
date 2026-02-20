import { describe, expect, it, vi } from 'vitest';
import type { Polyhedron } from '../geometry/geometry';
import { CSGToData } from '../geometry/CSGToData';
import { serializeKeychainObj } from './objSerializer';

vi.mock('../geometry/CSGToData', () => ({
  CSGToData: vi.fn(),
}));

describe('serializeKeychainObj', () => {
  it('keeps legacy-compatible OBJ vertex format and coordinates', () => {
    const mockedCsgToData = vi.mocked(CSGToData);
    const exportedPolyhedron = { id: 'exported' } as unknown as Polyhedron;
    const polyhedron = {
      exportFlipped: vi.fn(() => exportedPolyhedron),
    } as unknown as Polyhedron;

    mockedCsgToData.mockReturnValue({
      vertices: [
        [10, 20, 30],
        [-5, 8, 2],
      ],
      indices: [[0, 1, 0]],
    });

    const serialized = serializeKeychainObj(polyhedron);

    expect(polyhedron.exportFlipped).toHaveBeenCalledTimes(1);
    expect(mockedCsgToData).toHaveBeenCalledWith(exportedPolyhedron);
    expect(serialized).toContain('v -260 80 30 1');
    expect(serialized).toContain('v -245 92 2 1');
    expect(serialized).not.toContain('10.0');
    expect(serialized).toContain('f 1 2 1');
  });
});
