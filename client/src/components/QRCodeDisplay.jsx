import { useMemo } from 'react';

/**
 * Lightweight, zero-dependency QR Code Generator for React.
 * Encodes text/URLs into a crisp SVG QR matrix (QR Code Model 2, Version 1-10 Byte Mode).
 */

// Reed-Solomon Galois Field (256) tables
const GF256_EXP = new Uint8Array(512);
const GF256_LOG = new Uint8Array(256);
(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[i] = x;
    GF256_EXP[i + 255] = x;
    GF256_LOG[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return GF256_EXP[GF256_LOG[a] + GF256_LOG[b]];
}

function polyMul(p1, p2) {
  const res = new Uint8Array(p1.length + p2.length - 1);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      res[i + j] ^= gfMul(p1[i], p2[j]);
    }
  }
  return res;
}

function getGeneratorPoly(deg) {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < deg; i++) {
    poly = polyMul(poly, new Uint8Array([1, GF256_EXP[i]]));
  }
  return poly;
}

// Version table for Byte mode (ECC L) - versions 1 to 6
const QR_VERSIONS = [
  null,
  { version: 1, size: 21, totalBytes: 26, dataBytes: 19, ecBytes: 7, ecBlocks: 1 },
  { version: 2, size: 25, totalBytes: 44, dataBytes: 34, ecBytes: 10, ecBlocks: 1 },
  { version: 3, size: 29, totalBytes: 70, dataBytes: 55, ecBytes: 15, ecBlocks: 1 },
  { version: 4, size: 33, totalBytes: 100, dataBytes: 80, ecBytes: 20, ecBlocks: 1 },
  { version: 5, size: 37, totalBytes: 134, dataBytes: 108, ecBytes: 26, ecBlocks: 1 },
  { version: 6, size: 41, totalBytes: 172, dataBytes: 136, ecBytes: 18, ecBlocks: 2 },
];

function selectVersion(dataLength) {
  for (let v = 1; v < QR_VERSIONS.length; v++) {
    // 4 bits mode + 8 bits count + data length
    const needed = dataLength + (v <= 9 ? 2 : 3);
    if (needed <= QR_VERSIONS[v].dataBytes) {
      return QR_VERSIONS[v];
    }
  }
  return QR_VERSIONS[QR_VERSIONS.length - 1];
}

function encodeData(text, info) {
  const bytes = new TextEncoder().encode(text);
  const data = [];

  // Mode: Byte (0100)
  // Character count: 8 bits for v1-9
  let bitBuffer = 0;
  let bitCount = 0;

  function putBits(val, numBits) {
    for (let i = numBits - 1; i >= 0; i--) {
      bitBuffer = (bitBuffer << 1) | ((val >> i) & 1);
      bitCount++;
      if (bitCount === 8) {
        data.push(bitBuffer);
        bitBuffer = 0;
        bitCount = 0;
      }
    }
  }

  putBits(0b0100, 4); // Byte mode
  putBits(bytes.length, 8); // Length
  for (let b of bytes) {
    putBits(b, 8);
  }

  // Terminator (up to 4 zeroes)
  const remainingBits = info.dataBytes * 8 - (data.length * 8 + bitCount);
  putBits(0, Math.min(4, Math.max(0, remainingBits)));

  // Pad to byte boundary
  if (bitCount > 0) {
    putBits(0, 8 - bitCount);
  }

  // Pad bytes: 0xEC, 0x11 alternating
  const pad = [0xec, 0x11];
  let padIdx = 0;
  while (data.length < info.dataBytes) {
    data.push(pad[padIdx % 2]);
    padIdx++;
  }

  return new Uint8Array(data);
}

function calculateEC(data, totalBytes, ecBytes, ecBlocks) {
  const bytesPerBlock = Math.floor(data.length / ecBlocks);
  const ecPerBlock = ecBytes;
  const gen = getGeneratorPoly(ecPerBlock);

  const ecData = [];
  for (let b = 0; b < ecBlocks; b++) {
    const blockData = data.slice(b * bytesPerBlock, (b + 1) * bytesPerBlock);
    const msg = new Uint8Array(blockData.length + ecPerBlock);
    msg.set(blockData, 0);

    for (let i = 0; i < blockData.length; i++) {
      const coef = msg[i];
      if (coef !== 0) {
        for (let j = 0; j < gen.length; j++) {
          msg[i + j] ^= gfMul(gen[j], coef);
        }
      }
    }
    ecData.push(msg.slice(blockData.length));
  }

  // Interleave
  const finalBytes = [];
  for (let i = 0; i < data.length; i++) {
    finalBytes.push(data[i]);
  }
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < ecBlocks; b++) {
      finalBytes.push(ecData[b][i]);
    }
  }

  return new Uint8Array(finalBytes);
}

function createMatrix(info, dataWithEc) {
  const n = info.size;
  const matrix = Array.from({ length: n }, () => new Int8Array(n).fill(-1));

  // Finder pattern
  function drawFinder(r0, c0) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[r0 + r][c0 + c] = isBorder || isCenter ? 1 : 0;
      }
    }
    // Separators
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const row = r0 + r;
        const col = c0 + c;
        if (row >= 0 && row < n && col >= 0 && col < n && matrix[row][col] === -1) {
          matrix[row][col] = 0;
        }
      }
    }
  }

  drawFinder(0, 0);
  drawFinder(0, n - 7);
  drawFinder(n - 7, 0);

  // Timing patterns
  for (let i = 8; i < n - 8; i++) {
    if (matrix[6][i] === -1) matrix[6][i] = i % 2 === 0 ? 1 : 0;
    if (matrix[i][6] === -1) matrix[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // Alignment pattern for v2+
  if (info.version >= 2) {
    const pos = info.version === 2 ? 18 : info.version === 3 ? 22 : info.version === 4 ? 26 : info.version === 5 ? 30 : 34;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        const isBorder = Math.abs(r) === 2 || Math.abs(c) === 2;
        const isCenter = r === 0 && c === 0;
        matrix[pos + r][pos + c] = isBorder || isCenter ? 1 : 0;
      }
    }
  }

  // Dark module
  matrix[4 * info.version + 9][8] = 1;

  // Format info area reservation
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === -1) matrix[8][i] = 0;
    if (matrix[i][8] === -1) matrix[i][8] = 0;
  }
  for (let i = n - 8; i < n; i++) {
    if (matrix[8][i] === -1) matrix[8][i] = 0;
    if (matrix[i][8] === -1) matrix[i][8] = 0;
  }

  // Write data bits (mask 0: (r + c) % 2 === 0)
  let bitIdx = 0;
  const totalBits = dataWithEc.length * 8;
  let upwards = true;

  for (let right = n - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column

    for (let vert = 0; vert < n; vert++) {
      const r = upwards ? n - 1 - vert : vert;

      for (let c = right; c >= right - 1; c--) {
        if (matrix[r][c] === -1) {
          let bit = 0;
          if (bitIdx < totalBits) {
            const byte = dataWithEc[Math.floor(bitIdx / 8)];
            bit = (byte >> (7 - (bitIdx % 8))) & 1;
            bitIdx++;
          }
          // Apply mask 0: (r + c) % 2 === 0
          const mask = (r + c) % 2 === 0;
          matrix[r][c] = mask ? bit ^ 1 : bit;
        }
      }
    }
    upwards = !upwards;
  }

  // Format info: ECC Level L (01), Mask 000 -> 01000 with BCH error correction
  // Precomputed 15-bit format string for L-Mask0: 111011111000100 (0x77C4 ^ 0x5412 = 0x23D6)
  const formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];
  const maskBits = [1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0];
  const finalFormat = formatBits.map((b, i) => b ^ maskBits[i]);

  // Place format info around top-left finder
  for (let i = 0; i < 6; i++) matrix[8][i] = finalFormat[i];
  matrix[8][7] = finalFormat[6];
  matrix[8][8] = finalFormat[7];
  matrix[7][8] = finalFormat[8];
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = finalFormat[i];

  // Place format info along edges
  for (let i = 0; i < 7; i++) matrix[n - 1 - i][8] = finalFormat[i];
  for (let i = 7; i < 15; i++) matrix[8][n - 15 + i] = finalFormat[i];

  return matrix;
}

export default function QRCodeDisplay({
  value = '',
  size = 200,
  fgColor = '#0f172a',
  bgColor = '#ffffff',
  className = '',
  title = 'Pickup Verification QR Code',
}) {
  const svgData = useMemo(() => {
    if (!value) return null;
    try {
      const info = selectVersion(new TextEncoder().encode(value).length);
      const data = encodeData(value, info);
      const dataWithEc = calculateEC(data, info.totalBytes, info.ecBytes, info.ecBlocks);
      const matrix = createMatrix(info, dataWithEc);
      const n = matrix.length;

      // Draw SVG paths for dark modules
      let pathD = '';
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (matrix[r][c] === 1) {
            pathD += `M${c},${r}h1v1h-1z `;
          }
        }
      }

      return { n, pathD };
    } catch (err) {
      console.warn('QR code generation fallback:', err.message);
      return null;
    }
  }, [value]);

  if (!svgData) {
    return (
      <div
        className={`qr-display-fallback ${className}`}
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: bgColor,
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          color: '#64748b',
          fontSize: '12px',
          textAlign: 'center',
          padding: '12px',
        }}
      >
        QR Preview Unavailable
      </div>
    );
  }

  const { n, pathD } = svgData;
  const padding = 2; // quiet zone
  const totalDim = n + padding * 2;

  return (
    <div
      className={`fb-qr-container ${className}`}
      style={{
        display: 'inline-flex',
        padding: '12px',
        backgroundColor: bgColor,
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
      }}
    >
      <svg
        viewBox={`0 0 ${totalDim} ${totalDim}`}
        width={size}
        height={size}
        shapeRendering="crispEdges"
        role="img"
        aria-label={title}
        style={{ width: size, height: size, display: 'block' }}
      >
        <rect width={totalDim} height={totalDim} fill={bgColor} />
        <g transform={`translate(${padding}, ${padding})`}>
          <path d={pathD} fill={fgColor} />
        </g>
      </svg>
    </div>
  );
}
