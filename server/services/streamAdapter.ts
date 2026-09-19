import { EventEmitter } from 'events';
import { Transaction } from '../../src/types/fraud';
import { generateSyntheticTransactions } from './dataGenerator';
import { globalStorage } from './storage';

export interface KafkaConfig {
  brokers: string[];
  topic: string;
  groupId: string;
  enabled: boolean;
}

export class StreamingAdapter extends EventEmitter {
  private kafkaConfig: KafkaConfig;
  private isSimulating = false;
  private simulationTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.kafkaConfig = {
      brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'],
      topic: process.env.KAFKA_TOPIC || 'fraudshield.transactions.incoming',
      groupId: process.env.KAFKA_GROUP_ID || 'fraudshield-scoring-consumer',
      enabled: process.env.KAFKA_ENABLED === 'true'
    };
  }

  public getKafkaStatus() {
    return {
      enabled: this.kafkaConfig.enabled,
      brokers: this.kafkaConfig.brokers,
      topic: this.kafkaConfig.topic,
      groupId: this.kafkaConfig.groupId,
      connected: this.kafkaConfig.enabled ? false : true, // Local simulator active
      mode: this.kafkaConfig.enabled ? 'KAFKA_BROKER' : 'BUILTIN_SIMULATOR',
      isSimulating: this.isSimulating
    };
  }

  public startSimulation(intervalMs = 4000) {
    if (this.isSimulating) return;
    this.isSimulating = true;

    this.simulationTimer = setInterval(() => {
      // Generate single live transaction
      const batch = generateSyntheticTransactions(1);
      const newTx = batch[0];
      newTx.timestamp = new Date().toISOString();
      newTx.id = `TX-${Math.floor(200000 + Math.random() * 800000)}`;
      
      const stored = globalStorage.addTransaction(newTx);
      this.emit('transaction', stored);
    }, intervalMs);
  }

  public stopSimulation() {
    this.isSimulating = false;
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
  }

  public emitTransaction(tx: Transaction) {
    const stored = globalStorage.addTransaction(tx);
    this.emit('transaction', stored);
    return stored;
  }
}

export const globalStreamAdapter = new StreamingAdapter();
