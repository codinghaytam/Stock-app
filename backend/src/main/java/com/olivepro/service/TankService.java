package com.olivepro.service;

import com.olivepro.domain.Tank;
import com.olivepro.dto.request.TankRequest;
import com.olivepro.dto.request.TankTransferRequest;
import com.olivepro.enums.TankStatus;
import com.olivepro.exception.BusinessRuleException;
import com.olivepro.exception.ResourceNotFoundException;
import com.olivepro.repository.TankRepository;
import com.olivepro.util.WeightedAverageUtil;
import com.olivepro.websocket.AlertsBroadcaster;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class TankService {

    private static final Logger log = LoggerFactory.getLogger(TankService.class);
    private final TankRepository repo;
    private final ActivityLogService logService;
    private final AlertsBroadcaster broadcaster;

    public TankService(TankRepository repo, ActivityLogService logService, AlertsBroadcaster broadcaster) {
        this.repo = repo; this.logService = logService; this.broadcaster = broadcaster;
    }

    public List<Tank> getAll() { return repo.findAllByOrderByCreatedAtDesc(); }

    public Tank getById(Long id) {
        return repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Tank not found: " + id));
    }

    @Transactional
    public Tank create(TankRequest req, String username) {
        Tank t = Tank.builder().name(req.getName()).capacity(req.getCapacity())
                .status(TankStatus.EMPTY).notes(req.getNotes()).build();
        logService.log(username, "Citerne", "Création: " + req.getName(), null);
        return repo.save(t);
    }

    @Transactional
    public Tank update(Long id, TankRequest req, String username) {
        Tank t = getById(id);
        t.setName(req.getName());
        t.setCapacity(req.getCapacity());
        t.setNotes(req.getNotes());
        logService.log(username, "Citerne", "Mise à jour: " + req.getName(), null);
        return repo.save(t);
    }

    @Transactional
    public void delete(Long id, String username) {
        Tank t = getById(id);
        if (t.getCurrentLevel() > 0)
            throw new BusinessRuleException("Impossible de supprimer une citerne non vide");
        repo.delete(t);
        logService.log(username, "Citerne", "Suppression: " + t.getName(), null);
    }

    /** Fill a tank and recalculate weighted averages. Called internally. */
    @Transactional
    public Tank fill(Long tankId, double qty, double acidity, double waxes, double unitCost) {
        Tank t = getById(tankId);
        double newLevel = t.getCurrentLevel() + qty;
        if (newLevel > t.getCapacity())
            throw new BusinessRuleException("Capacité maximale dépassée pour " + t.getName());
        t.setAcidity(WeightedAverageUtil.recalc(t.getCurrentLevel(), t.getAcidity(), qty, acidity));
        t.setWaxes(WeightedAverageUtil.recalc(t.getCurrentLevel(), t.getWaxes(), qty, waxes));
        t.setAvgCost(WeightedAverageUtil.recalc(t.getCurrentLevel(), t.getAvgCost(), qty, unitCost));
        t.setCurrentLevel(newLevel);
        updateStatus(t);
        log.info("Tank {} filled +{}L, level={}", t.getName(), qty, newLevel);
        return repo.save(t);
    }

    /** Drain a tank. Called internally. */
    @Transactional
    public Tank drain(Long tankId, double qty) {
        Tank t = getById(tankId);
        if (t.getCurrentLevel() < qty)
            throw new BusinessRuleException("Niveau insuffisant dans " + t.getName() +
                    ". Disponible: " + t.getCurrentLevel() + "L, Demandé: " + qty + "L");
        t.setCurrentLevel(t.getCurrentLevel() - qty);
        if (t.getCurrentLevel() == 0) { t.setAcidity(0); t.setWaxes(0); t.setAvgCost(0); }
        updateStatus(t);
        log.info("Tank {} drained -{}L, level={}", t.getName(), qty, t.getCurrentLevel());
        return repo.save(t);
    }

    @Transactional
    public void transfer(TankTransferRequest req, String username) {
        Tank source = getById(req.getSourceTankId());
        double srcAcidity = source.getAcidity();
        double srcWaxes = source.getWaxes();
        double srcCost = source.getAvgCost();
        drain(req.getSourceTankId(), req.getQuantity());
        fill(req.getDestTankId(), req.getQuantity(), srcAcidity, srcWaxes, srcCost);
        logService.log(username, "Transfert", "De " + req.getSourceTankId() + " vers " +
                req.getDestTankId() + " : " + req.getQuantity() + "L", null);
        broadcaster.broadcast();
    }

    private void updateStatus(Tank t) {
        if (t.getCurrentLevel() <= 0) t.setStatus(TankStatus.EMPTY);
        else if (t.getCurrentLevel() >= t.getCapacity()) t.setStatus(TankStatus.FULL);
        else t.setStatus(TankStatus.FILLING);
    }
}

