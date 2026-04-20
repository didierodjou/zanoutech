// src/schedule/schedule.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ScheduleService {
  constructor(private prisma: PrismaService) {}

  // 1. Créer un nouveau créneau
  async create(data: any) {
    // Vérifier si le cours existe
    const course = await this.prisma.course.findUnique({
      where: { id: data.courseId },
      include: {
        class: true,
        teacher: true
      }
    });

    if (!course) {
      throw new NotFoundException(`Cours avec ID ${data.courseId} non trouvé`);
    }

    // Vérifier les conflits
    const conflict = await this.checkConflict(
      data.classId,
      data.dayOfWeek,
      data.startTime,
      data.endTime,
      data.room
    );

    if (conflict.hasConflict) {
      throw new ConflictException(`Conflit d'horaire: ${conflict.message}`);
    }

    // Créer le créneau
    return this.prisma.scheduleSlot.create({
      data: {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
        course: {
          connect: { id: data.courseId }
        },
        class: {
          connect: { id: data.classId }
        }
      },
      include: {
        course: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            class: {
              select: {
                id: true,
                name: true,
                level: true
              }
            }
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            level: true
          }
        }
      }
    });
  }

  // 2. Lister tous les créneaux
  async findAll() {
    return this.prisma.scheduleSlot.findMany({
      include: {
        course: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            class: {
              select: {
                id: true,
                name: true,
                level: true
              }
            }
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            level: true
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });
  }

  // 3. Trouver un créneau par ID
  async findOne(id: string) {
    const slot = await this.prisma.scheduleSlot.findUnique({
      where: { id },
      include: {
        course: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            class: {
              select: {
                id: true,
                name: true,
                level: true
              }
            }
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            level: true
          }
        }
      }
    });

    if (!slot) {
      throw new NotFoundException(`Créneau avec ID ${id} non trouvé`);
    }

    return slot;
  }

  // 4. Créneaux par classe
  async findByClass(classId: string) {
    return this.prisma.scheduleSlot.findMany({
      where: { classId },
      include: {
        course: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });
  }

  // 5. Créneaux par professeur
  async findByTeacher(teacherId: string) {
    return this.prisma.scheduleSlot.findMany({
      where: {
        course: {
          teacherId
        }
      },
      include: {
        course: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            class: {
              select: {
                id: true,
                name: true,
                level: true
              }
            }
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            level: true
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });
  }

  // 6. Créneaux par jour
  async findByDay(dayOfWeek: number) {
    return this.prisma.scheduleSlot.findMany({
      where: { dayOfWeek },
      include: {
        course: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            class: {
              select: {
                id: true,
                name: true,
                level: true
              }
            }
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            level: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });
  }

  // 7. Créneaux par salle
  async findByRoom(room: string) {
    return this.prisma.scheduleSlot.findMany({
      where: { 
        room: {
          contains: room,
          mode: 'insensitive'
        }
      },
      include: {
        course: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            class: {
              select: {
                id: true,
                name: true,
                level: true
              }
            }
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            level: true
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });
  }

  // 8. Mettre à jour un créneau
  async update(id: string, data: any) {
    const slot = await this.prisma.scheduleSlot.findUnique({
      where: { id }
    });

    if (!slot) {
      throw new NotFoundException(`Créneau avec ID ${id} non trouvé`);
    }

    // Vérifier les conflits (en excluant ce créneau)
    const conflict = await this.checkConflict(
      data.classId || slot.classId,
      data.dayOfWeek || slot.dayOfWeek,
      data.startTime || slot.startTime,
      data.endTime || slot.endTime,
      data.room || slot.room,
      id
    );

    if (conflict.hasConflict) {
      throw new ConflictException(`Conflit d'horaire: ${conflict.message}`);
    }

    return this.prisma.scheduleSlot.update({
      where: { id },
      data: {
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        room: data.room,
        courseId: data.courseId,
        classId: data.classId,
      },
      include: {
        course: {
          include: {
            subject: true,
            teacher: true
          }
        },
        class: true
      }
    });
  }

  // 9. Supprimer un créneau
  async delete(id: string) {
    const slot = await this.prisma.scheduleSlot.findUnique({
      where: { id }
    });

    if (!slot) {
      throw new NotFoundException(`Créneau avec ID ${id} non trouvé`);
    }

    return this.prisma.scheduleSlot.delete({
      where: { id }
    });
  }

  // 10. Vérifier les conflits d'horaire
  async checkConflict(
    classId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    room: string,
    excludeId?: string
  ) {
    // Convertir les heures en minutes pour faciliter la comparaison
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    // Construire la requête de base
    const whereClause: any = {
      dayOfWeek,
      OR: [
        // Conflit pour la même classe
        { classId },
        // Conflit pour la même salle (si la salle est spécifiée)
        ...(room ? [{ room }] : [])
      ]
    };

    // Exclure le créneau en cours de modification
    if (excludeId) {
      whereClause.NOT = { id: excludeId };
    }

    // Récupérer tous les créneaux potentiellement conflictuels
    const slots = await this.prisma.scheduleSlot.findMany({
      where: whereClause
    });

    // Vérifier chaque créneau
    for (const slot of slots) {
      const slotStart = this.timeToMinutes(slot.startTime);
      const slotEnd = this.timeToMinutes(slot.endTime);

      // Vérifier le chevauchement
      if (this.doTimeRangesOverlap(startMinutes, endMinutes, slotStart, slotEnd)) {
        let message = '';
        if (slot.classId === classId) {
          message = `La classe a déjà un cours prévu à ce créneau (${slot.startTime}-${slot.endTime})`;
        } else if (room && slot.room === room) {
          message = `La salle ${room} est déjà occupée à ce créneau (${slot.startTime}-${slot.endTime})`;
        }
        return { hasConflict: true, message };
      }
    }

    return { hasConflict: false, message: '' };
  }

  // 11. Obtenir l'emploi du temps d'une classe pour une semaine
  async getWeeklySchedule(classId: string, weekStart: Date) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return this.prisma.scheduleSlot.findMany({
      where: {
        classId,
      },
      include: {
        course: {
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                color: true
              }
            },
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });
  }

  // 12. Obtenir les salles disponibles à un créneau donné
  async getAvailableRooms(dayOfWeek: number, startTime: string, endTime: string) {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);

    // Récupérer toutes les salles occupées
    const occupiedSlots = await this.prisma.scheduleSlot.findMany({
      where: { 
        dayOfWeek,
        room: { not: null }
      },
      select: { room: true }
    });

    const occupiedRooms = new Set(occupiedSlots.map(s => s.room));

    return {
      message: 'Fonctionnalité à implémenter avec une liste de salles',
      occupiedRooms: Array.from(occupiedRooms).filter(room => room !== null)
    };
  }

  // 13. Statistiques de l'emploi du temps
  async getStats() {
    const slots = await this.prisma.scheduleSlot.findMany({
      include: {
        course: {
          include: {
            teacher: true,
            subject: true
          }
        },
        class: true
      }
    });

    const stats = {
      totalSlots: slots.length,
      byDay: {} as Record<number, number>,
      byTeacher: {} as Record<string, number>,
      byClass: {} as Record<string, number>,
      bySubject: {} as Record<string, number>,
      averagePerDay: 0,
      mostUsedRoom: ''
    };

    const roomCounts: Record<string, number> = {};

    slots.forEach(slot => {
      // Par jour
      stats.byDay[slot.dayOfWeek] = (stats.byDay[slot.dayOfWeek] || 0) + 1;

      // Par professeur
      const teacherName = `${slot.course.teacher.firstName} ${slot.course.teacher.lastName}`;
      stats.byTeacher[teacherName] = (stats.byTeacher[teacherName] || 0) + 1;

      // Par classe
      stats.byClass[slot.class.name] = (stats.byClass[slot.class.name] || 0) + 1;

      // Par matière
      stats.bySubject[slot.course.subject.name] = (stats.bySubject[slot.course.subject.name] || 0) + 1;

      // Salles (seulement si non null)
      if (slot.room) {
        roomCounts[slot.room] = (roomCounts[slot.room] || 0) + 1;
      }
    });

    stats.averagePerDay = slots.length / 5; // 5 jours de classe
    
    const roomEntries = Object.entries(roomCounts);
    stats.mostUsedRoom = roomEntries.length > 0 
      ? roomEntries.sort((a, b) => b[1] - a[1])[0][0] 
      : 'Aucune salle';

    return stats;
  }

  // ================ FONCTIONS UTILITAIRES ================

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private doTimeRangesOverlap(
    start1: number,
    end1: number,
    start2: number,
    end2: number
  ): boolean {
    return start1 < end2 && start2 < end1;
  }
}