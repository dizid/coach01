import { Agent, fetch as undiciFetch } from 'undici';

// Force IPv4 connections to avoid IPv6 timeout issues on this system
const agent = new Agent({ connect: { family: 4 } });

/**
 * A drop-in replacement for fetch that forces IPv4 connections.
 * @param {string|URL} url
 * @param {RequestInit} [opts]
 * @returns {Promise<Response>}
 */
export function fetchIPv4(url, opts = {}) {
  return undiciFetch(url, { ...opts, dispatcher: agent });
}
